from __future__ import annotations

import json
from typing import Any, Dict

from openai import OpenAI

from ..config import POLZA_API_BASE, POLZA_API_KEY, POLZA_MODEL


class PolzaClient:
    def __init__(self, api_key: str | None = None, base_url: str | None = None, model: str | None = None):
        self.api_key = api_key or POLZA_API_KEY
        self.base_url = base_url or POLZA_API_BASE
        self.model = model or POLZA_MODEL
        if not self.api_key:
            raise RuntimeError("POLZA_API_KEY is not configured")
        # OpenAI-compatible client
        self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)

    def extract_vacancy(self, raw_text: str) -> Dict[str, Any]:
        """
        Calls an LLM via Polza to extract a normalized vacancy object.
        The output is a JSON object with keys: title, description, seniority, skills, weights.
        """
        system_prompt = (
            "Ты помощник HR. Тебе дадут текст вакансии (в любом формате). "
            "Твоя задача — извлечь и нормализовать поля под нашу схему данных. "
            "Верни строго JSON без пояснений. Схема: {\n"
            "  title: string — краткое название вакансии;\n"
            "  description: string — связное описание (обязанности, условия, требования), объединённое в один текст;\n"
            "  seniority: string — один из ['Junior','Middle','Senior'] (угадай по тексту, по умолчанию 'Middle');\n"
            "  skills: string[] — список ключевых навыков (3-12), в нижнем регистре;\n"
            "  weights: object — веса критериев подбора: { technical: number, communication: number, cases: number } (в сумме ≈1.0).\n"
            "  details?: object — дополнительные поля если удастся распознать: {\n"
            "    status?: string, region?: string, city?: string, address?: string,\n"
            "    employment_type?: string, employment_format?: string, schedule_text?: string,\n"
            "    income_month_rub?: string, salary_min_rub?: string, salary_max_rub?: string,\n"
            "    annual_bonus_percent?: string, bonus_type?: string, bonus_desc?: string,\n"
            "    education_level?: string, experience?: string, travel_required?: string|boolean,\n"
            "    languages?: string, language_level?: string, extra_info?: string\n"
            "  }\n"
            "}"
        )

        user_prompt = (
            "Вот содержимое файла с вакансией. Извлеки данные и верни JSON по схеме.\n\n" + raw_text
        )

        def _call(response_format: bool):
            kwargs = dict(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
                max_tokens=800,
            )
            if response_format:
                # Some providers may not support response_format; we'll retry without it on failure
                kwargs["response_format"] = {"type": "json_object"}
            return self.client.chat.completions.create(**kwargs)

        try:
            completion = _call(response_format=True)
            content = completion.choices[0].message.content or "{}"
        except Exception:
            try:
                # Retry without response_format in case the provider doesn't support it
                completion = _call(response_format=False)
                content = completion.choices[0].message.content or "{}"
            except Exception as e:
                # Fallback to rule-based extractor
                return self.extract_vacancy_fallback(raw_text)
        try:
            data = json.loads(content)
        except json.JSONDecodeError:
            # Best-effort fallback: try to find JSON braces
            start = content.find("{")
            end = content.rfind("}")
            if start >= 0 and end > start:
                data = json.loads(content[start : end + 1])
            else:
                raise

        # Normalize defaults
        title = str(data.get("title") or "Вакансия")
        description = str(data.get("description") or "")
        seniority = str(data.get("seniority") or "Middle")
        skills = data.get("skills") or []
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]
        skills = [str(s).strip() for s in skills if str(s).strip()]
        weights = data.get("weights") or {}
        technical = float(weights.get("technical") or 0.5)
        communication = float(weights.get("communication") or 0.3)
        cases = float(weights.get("cases") or 0.2)
        # Normalize sum roughly to 1
        total = technical + communication + cases
        if total > 0:
            technical /= total
            communication /= total
            cases /= total

        # Normalize casing and acronyms in title/description and skills
        title = _normalize_title(title)
        description = _normalize_description(description)
        skills = [_normalize_skill(s) for s in skills]

        # Pass through details if present
        details = data.get("details") or {}
        if isinstance(details, dict):
            details = _normalize_details(details)
        else:
            details = {}

        return {
            "title": title,
            "description": description,
            "seniority": _normalize_seniority(seniority),
            "skills": skills,
            "weights": {"technical": technical, "communication": communication, "cases": cases},
            "details": details,
        }

    def generate_vacancy(self, brief_text: str) -> Dict[str, Any]:
        """
        Given a short brief (title, seniority, bullet highlights), generate a polished vacancy object.
        Output schema is the same as extract_vacancy().
        """
        system_prompt = (
            "Ты помощник HR. По короткому брифу нужно сгенерировать полное описание вакансии. "
            "Верни JSON: { title, description, seniority in ['Junior','Middle','Senior'], skills[3..12] (в нижнем регистре), weights{technical,communication,cases}≈1 }."
        )
        user_prompt = (
            "Бриф вакансии:\n" + brief_text + "\n\nСгенерируй связное, лаконичное описание, объединяя пункты в предложения."
        )
        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.4,
                max_tokens=700,
                response_format={"type": "json_object"},
            )
            content = completion.choices[0].message.content or "{}"
            data = json.loads(content)
        except Exception:
            return {}

        # Normalize via existing helpers
        title = _normalize_title(str(data.get("title") or "Вакансия"))
        description = _normalize_description(str(data.get("description") or ""))
        seniority = _normalize_seniority(str(data.get("seniority") or "Middle"))
        skills = data.get("skills") or []
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]
        skills = [_normalize_skill(str(s)) for s in skills if str(s).strip()]
        weights = data.get("weights") or {}
        technical = float(weights.get("technical") or 0.5)
        communication = float(weights.get("communication") or 0.3)
        cases = float(weights.get("cases") or 0.2)
        total = technical + communication + cases
        if total > 0:
            technical /= total; communication /= total; cases /= total
        return {
            "title": title,
            "description": description,
            "seniority": seniority,
            "skills": skills,
            "weights": {"technical": technical, "communication": communication, "cases": cases},
        }

    def extract_profile(self, raw_text: str) -> Dict[str, Any]:
        system_prompt = (
            "Ты помощник HR. По тексту резюме извлеки профиль кандидата. Верни JSON: {\n"
            " summary: string — краткое резюме (3-6 предложений),\n"
            " skills: string[] — ключевые навыки (6-15) в нижнем регистре,\n"
            " details: object — поля (если есть): { location, citizenship, work_permit, relocation_ready, travel_ready, desired_position, specializations[], employment_type, schedule, commute_time, experience_years, jobs_text, last_updated }\n"
            "}"
        )
        user_prompt = "Текст резюме:\n\n" + raw_text
        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                temperature=0.2,
                max_tokens=900,
                response_format={"type": "json_object"},
            )
            content = completion.choices[0].message.content or "{}"
            data = json.loads(content)
        except Exception:
            return {}
        # Normalize
        summary = _normalize_description(str(data.get("summary") or ""))
        skills = data.get("skills") or []
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]
        skills = [str(s).lower().strip() for s in skills if str(s).strip()]
        details = data.get("details") or {}
        if not isinstance(details, dict):
            details = {}
        return {"summary": summary, "skills": skills, "details": details}

    @staticmethod
    def extract_profile_fallback(raw_text: str) -> Dict[str, Any]:
        import re
        text = raw_text.replace("\r", "\n")
        text = re.sub(r"\n+", "\n", text)
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        joined = "\n".join(lines)
        def find(keys: list[str]) -> str | None:
            for k in keys:
                m = re.search(rf"{re.escape(k)}\s*[:\-]?\s*(.+)", joined, flags=re.IGNORECASE)
                if m:
                    val = m.group(1).strip()
                    val = re.split(r"\n[A-ZА-Я].{0,40}:?\s", val)[0].strip()
                    return val
            return None
        summary = " ".join(lines[:8])[:1800]
        details = {}
        def put(k: str, v: str | None):
            if v and v.strip(): details[k] = v.strip()
        put("location", find(["Проживает", "Город проживания"]))
        put("citizenship", find(["Гражданство"]))
        put("work_permit", find(["разрешение на работу"]))
        put("relocation_ready", find(["переезду"]))
        put("travel_ready", find(["командировк"]))
        put("desired_position", find(["Желаемая должность", "Желаемая должность и зарплата"]))
        put("specializations", find(["Специализаци"]))
        put("employment_type", find(["Занятость"]))
        put("schedule", find(["График работы"]))
        put("commute_time", find(["время в пути"]))
        put("experience_years", find(["Опыт работы"]))
        put("last_updated", find(["Резюме обновлено"]))
        # crude jobs_text
        jt = []
        for i, l in enumerate(lines):
            if re.search(r"(Опыт работы|Experience)", l, flags=re.IGNORECASE):
                jt = lines[i:i+120]
                break
        if jt:
            details["jobs_text"] = "\n".join(jt)[:4000]
        # naive skills: nouns-like tokens
        tokens = re.split(r"[\n,;•\-\u2022\s]", joined)
        skills = []
        for t in tokens:
            t = t.strip().lower()
            if 2 <= len(t) <= 24 and any(c.isalpha() for c in t):
                skills.append(t)
        seen = set(); uniq = []
        for s in skills:
            if s not in seen:
                seen.add(s); uniq.append(s)
        return {"summary": _normalize_description(summary), "skills": uniq[:20], "details": details}

    def generate_profile(self, brief_text: str) -> Dict[str, Any]:
        system_prompt = (
            "Ты помощник HR. Сгенерируй профиль кандидата по краткому брифу. Верни JSON: { summary(3-6 предложений), skills[6..15] (нижний регистр), details{location?, desired_position?, employment_type?, schedule?} }."
        )
        user_prompt = "Бриф кандидата:\n" + brief_text
        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                temperature=0.4,
                max_tokens=700,
                response_format={"type": "json_object"},
            )
            content = completion.choices[0].message.content or "{}"
            data = json.loads(content)
        except Exception:
            return {}
        summary = _normalize_description(str(data.get("summary") or ""))
        skills = data.get("skills") or []
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]
        details = data.get("details") or {}
        if not isinstance(details, dict): details = {}
        return {"summary": summary, "skills": [str(s).lower() for s in skills if str(s).strip()], "details": details}

    def assess_application(self, vacancy: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use LLM to assess candidate profile fit to the vacancy.
        Returns: { match_score: number (0..100), verdict: 'accept'|'reject'|'neutral', notes: string }
        """
        system_prompt = (
            "Ты помощник-рекрутер. Оцени соответствие профиля кандидата вакансии. "
            "Верни строго JSON: { match_score: number (0..100), verdict: 'accept'|'reject'|'neutral', notes: string }. "
            "Оцени по требованиям, ключевым навыкам и релевантному опыту."
        )
        vtxt = json.dumps({
            "title": vacancy.get("title"),
            "seniority": vacancy.get("seniority"),
            "skills": vacancy.get("skills"),
            "weights": vacancy.get("weights"),
            "description": vacancy.get("description"),
            "details": vacancy.get("details", {}),
        }, ensure_ascii=False)
        ptxt = json.dumps({
            "summary": profile.get("summary"),
            "skills": profile.get("skills"),
            "details": profile.get("details", {}),
        }, ensure_ascii=False)
        user_prompt = f"Вакансия:\n{vtxt}\n\nПрофиль кандидата:\n{ptxt}"
        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}],
                temperature=0.2,
                max_tokens=400,
                response_format={"type": "json_object"},
            )
            content = completion.choices[0].message.content or "{}"
            data = json.loads(content)
            score = float(data.get("match_score") or 0)
            verdict = str(data.get("verdict") or "neutral")
            notes = str(data.get("notes") or "")
            score = max(0.0, min(100.0, score))
            if verdict not in ("accept", "reject", "neutral"):
                verdict = "neutral"
            return {"match_score": score, "verdict": verdict, "notes": notes}
        except Exception:
            return self.assess_application_fallback(vacancy, profile)

    @staticmethod
    def assess_application_fallback(vacancy: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
        """Heuristic scoring based on skill overlap and text containment."""
        import re
        vskills = [str(s).lower().strip() for s in (vacancy.get("skills") or []) if str(s).strip()]
        pskills = [str(s).lower().strip() for s in (profile.get("skills") or []) if str(s).strip()]
        vset = set(vskills)
        pset = set(pskills)
        overlap = vset.intersection(pset)
        # token overlap from description/summary
        def tok(s: str):
            return {t for t in re.split(r"[^\wа-яА-Я]+", (s or "").lower()) if 2 <= len(t) <= 24}
        dscore = 0.0
        vdesc = tok(vacancy.get("description") or "")
        psum = tok(profile.get("summary") or "")
        if vdesc and psum:
            dscore = len(vdesc.intersection(psum)) / max(1, len(vdesc))
        # base skill score
        sscore = len(overlap) / max(1, len(vset))
        score = 100.0 * (0.75 * sscore + 0.25 * dscore)
        score = max(0.0, min(100.0, score))
        verdict = "accept" if score >= 65 else "neutral" if score >= 45 else "reject"
        missing = list(vset - overlap)[:6]
        notes = "Совпадения по навыкам: " + (", ".join(sorted(overlap)) or "нет")
        if missing:
            notes += "; Недостаёт: " + ", ".join(sorted(missing))
        return {"match_score": round(score, 2), "verdict": verdict, "notes": notes}

    @staticmethod
    def extract_vacancy_fallback(raw_text: str) -> Dict[str, Any]:
        """
        Heuristic fallback parser for Russian vacancy briefs (tables or free text).
        Extracts common fields and maps to our schema.
        """
        import re

        text = raw_text.replace("\r", "\n")
        # Normalize whitespace
        text = re.sub(r"\n+", "\n", text)
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        joined = "\n".join(lines)

        def find_value(keys: list[str]) -> str | None:
            for k in keys:
                # Match patterns like "Название" or "Название вакансии" followed by value on same or next line
                m = re.search(rf"{re.escape(k)}\s*[:\-]?\s*(.+)", joined, flags=re.IGNORECASE)
                if m:
                    val = m.group(1).strip()
                    # cut at next field hint if present
                    val = re.split(r"\n[A-ZА-Я].{0,40}:?\s", val)[0].strip()
                    return val
            return None

        title = find_value(["Название", "Название вакансии"]) or (lines[1] if len(lines) > 1 else "Вакансия")
        duties = find_value(["Обязанности", "Обязанности (для публикации)"]) or ""
        reqs = find_value(["Требования", "Требования (для публикации)"]) or ""
        extra = find_value(["Дополнительная информация"]) or ""
        # Details from common table-like briefs
        details: Dict[str, Any] = {}
        def put(k: str, v: str | None):
            if v is not None and str(v).strip():
                details[k] = str(v).strip()

        put("status", find_value(["Статус"]))
        put("region", find_value(["Регион"]))
        put("city", find_value(["Город"]))
        put("address", find_value(["Адрес"]))
        put("employment_type", find_value(["Тип трудового", "Тип трудового договора"]))
        put("employment_format", find_value(["Тип занятости"]))
        put("schedule_text", find_value(["Текст график работы", "Формат работы", "График работы"]))
        put("income_month_rub", find_value(["Доход (руб/мес)"]))
        put("salary_max_rub", find_value(["Оклад макс. (руб/мес)"]))
        put("salary_min_rub", find_value(["Оклад мин. (руб/мес)"]))
        put("annual_bonus_percent", find_value(["Годовая премия (%)"]))
        put("bonus_type", find_value(["Тип премирования", "Тип премирования. Описание"]))
        put("education_level", find_value(["Уровень образования"]))
        put("experience", find_value(["Требуемый опыт работы"]))
        put("languages", find_value(["Знание иностранных языков"]))
        put("language_level", find_value(["Уровень владения языка"]))
        travel = find_value(["Наличие командировок"]) or ""
        if travel:
            details["travel_required"] = travel.strip()
        # Merge extra info
        if extra:
            details["extra_info"] = extra
        description = "\n\n".join([p for p in [duties, reqs] if p])
        if not description:
            description = "\n".join(lines[:50])[:2000]
        # Normalize description sentences and acronyms
        description = _normalize_description(description)

        # Simple seniority inference
        lowered = joined.lower()
        seniority = "Middle"
        if any(w in lowered for w in ["ведущий", "старший", "lead", "senior"]):
            seniority = "Senior"
        elif any(w in lowered for w in ["младший", "junior"]):
            seniority = "Junior"

        # Skills heuristic: from requirements split by delimiters
        skills_src = reqs or duties
        tokens = re.split(r"[\n,;•\-\u2022]", skills_src)
        skills = []
        for t in tokens:
            t = t.strip().lower()
            if 2 <= len(t) <= 40 and any(c.isalpha() for c in t):
                # pick likely skill words
                skills.append(t)
        # Deduplicate and trim
        seen = set()
        uniq = []
        for s in skills:
            if s not in seen:
                seen.add(s)
                uniq.append(s)
        skills = [_normalize_skill(s) for s in uniq[:12]]

        return {
            "title": _normalize_title(title),
            "description": description,
            "seniority": _normalize_seniority(seniority),
            "skills": skills,
            "weights": {"technical": 0.5, "communication": 0.3, "cases": 0.2},
            "details": _normalize_details(details),
        }


# --- Normalization helpers ---
def _normalize_seniority(val: str) -> str:
    v = (val or "").strip().lower()
    if v.startswith("jun") or v == "junior":
        return "Junior"
    if v.startswith("sen") or "старш" in v or "lead" in v:
        return "Senior"
    return "Middle"


def _normalize_title(s: str) -> str:
    s = (s or "").strip()
    if not s:
        return s
    s = _normalize_acronyms(s)
    # Capitalize first letter (RU-safe)
    return s[:1].upper() + s[1:]


def _normalize_description(s: str) -> str:
    import re
    text = (s or "").strip()
    if not text:
        return text
    # Replace bullets with periods
    text = re.sub(r"[•\u2022]\s*", "", text)
    # Split into sentences conservatively by . ! ? or line breaks
    parts: list[str] = []
    for chunk in re.split(r"[\n\r]+|(?<=[\.!?])\s+", text):
        t = chunk.strip().strip("-•·—•")
        if not t:
            continue
        t = _normalize_acronyms(t)
        # Capitalize first letter
        t = t[:1].upper() + t[1:]
        if not re.search(r"[\.!?]$", t):
            t += "."
        parts.append(t)
    return " ".join(parts)


_ACRONYM_MAP = {
    "lan": "LAN",
    "san": "SAN",
    "bios": "BIOS",
    "bmc": "BMC",
    "raid": "RAID",
    "cmdb": "CMDB",
    "dcim": "DCIM",
    "excel": "Excel",
    "word": "Word",
    "visio": "Visio",
    "x86": "x86",
}


def _normalize_acronyms(s: str) -> str:
    import re
    def repl(m: re.Match[str]) -> str:
        word = m.group(0)
        low = word.lower()
        return _ACRONYM_MAP.get(low, word)
    return re.sub(r"[A-Za-z0-9]{2,5}", repl, s)


def _normalize_skill(s: str) -> str:
    s = (s or "").strip()
    if not s:
        return s
    low = s.lower()
    norm = _ACRONYM_MAP.get(low)
    if norm:
        return norm
    # Capitalize first for multiword like 'грамотная речь' -> 'Грамотная речь'
    return s[:1].upper() + s[1:]


def _normalize_details(details: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k, v in details.items():
        if v is None:
            continue
        sv = str(v).strip()
        if not sv:
            continue
        # Normalize some booleans / known fields
        lk = k.lower()
        if lk == "travel_required":
            val = sv.lower()
            out[k] = True if val in ("да", "true", "yes") else False if val in ("нет", "false", "no") else sv
            continue
        out[k] = sv
    return out
