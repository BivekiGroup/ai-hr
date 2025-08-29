from __future__ import annotations

from io import BytesIO
from typing import Optional


def _decode_best_effort(b: bytes) -> str:
    for enc in ("utf-8", "cp1251", "latin-1"):
        try:
            return b.decode(enc)
        except UnicodeDecodeError:
            continue
    return b.decode("utf-8", errors="ignore")


def extract_text_from_pdf(raw: bytes) -> str:
    try:
        from pdfminer.high_level import extract_text  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError("pdfminer.six is not installed") from e
    bio = BytesIO(raw)
    return extract_text(bio) or ""


def extract_text_from_docx(raw: bytes) -> str:
    try:
        from docx import Document  # type: ignore
    except Exception as e:  # pragma: no cover
        raise RuntimeError("python-docx is not installed") from e
    bio = BytesIO(raw)
    doc = Document(bio)
    parts: list[str] = []
    # Paragraphs
    for p in doc.paragraphs:
        txt = (p.text or "").strip()
        if txt:
            parts.append(txt)
    # Tables (common case: brief templates are tables)
    for table in getattr(doc, 'tables', []) or []:
        for row in table.rows:
            row_text = []
            for cell in row.cells:
                ctext = (cell.text or "").strip()
                if ctext:
                    row_text.append(ctext)
            if row_text:
                parts.append(" | ".join(row_text))
    return "\n".join(parts)


def extract_text_smart(raw: bytes, filename: Optional[str], content_type: Optional[str]) -> str:
    name = (filename or "").lower()
    ctype = (content_type or "").lower()

    try:
        if name.endswith(".pdf") or "pdf" in ctype:
            return extract_text_from_pdf(raw)
        if name.endswith(".docx") or "officedocument.wordprocessingml.document" in ctype:
            return extract_text_from_docx(raw)
    except Exception:
        # Fall back to best-effort decoding if specific parser fails
        pass

    return _decode_best_effort(raw)
