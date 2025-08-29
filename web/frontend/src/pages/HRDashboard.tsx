import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { approveVacancy, listVacancies, updateVacancy, uploadVacancyFile, deleteVacancy, archiveVacancy, unarchiveVacancy, revokeVacancy, generateVacancy, type Vacancy, listHrApplications, type Application, reassessApplication } from '@/api/vacancies'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export default function HRDashboard() {
  const { user, logout } = useAuth()
  const [items, setItems] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [genTitle, setGenTitle] = useState('')
  const [genSeniority, setGenSeniority] = useState('Middle')
  const [genHighlights, setGenHighlights] = useState('')
  const [generating, setGenerating] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const data = await listVacancies()
      setItems(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])
  const [apps, setApps] = useState<Application[]>([])
  async function refreshApps() {
    try { setApps(await listHrApplications()) } catch {}
  }
  useEffect(()=>{ refreshApps() }, [])
  // Auto-poll HR applications so оценка/новые отклики видны сразу
  useEffect(() => {
    const id = setInterval(() => { refreshApps() }, 10000)
    return () => clearInterval(id)
  }, [])

  // Manual creation removed; only file upload is supported

  async function onSave(id: number, payload: any) {
    try {
      const upd = await updateVacancy(id, payload)
      setItems(items.map(i => i.id === id ? upd : i))
      setEditingId(null)
      toast.success('Сохранено')
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось сохранить')
    }
  }
  async function onUpload() {
    if (!file) return
    setUploading(true)
    try {
      const created = await uploadVacancyFile(file)
      setItems([created, ...items])
      setFile(null)
      toast.success('Файл распознан, создан черновик')
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось распознать файл')
    } finally {
      setUploading(false)
    }
  }
  async function onApprove(id: number) {
    try {
      const upd = await approveVacancy(id)
      setItems(items.map(i => i.id === id ? upd : i))
      toast.success('Вакансия утверждена')
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось утвердить')
    }
  }
  async function onArchive(id: number) {
    try {
      const upd = await archiveVacancy(id)
      setItems(items.map(i => i.id === id ? upd : i))
      toast.success('Вакансия архивирована')
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось архивировать')
    }
  }
  async function onUnarchive(id: number) {
    try {
      const upd = await unarchiveVacancy(id)
      setItems(items.map(i => i.id === id ? upd : i))
      toast.success('Вакансия возвращена из архива')
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось вернуть из архива')
    }
  }
  async function onRevoke(id: number) {
    try {
      const upd = await revokeVacancy(id)
      setItems(items.map(i => i.id === id ? upd : i))
      toast.success('Утверждение отозвано')
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось отозвать утверждение')
    }
  }
  async function onDelete(id: number) {
    try {
      await deleteVacancy(id)
      setItems(items.filter(i => i.id !== id))
      toast.success('Вакансия удалена')
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось удалить')
    } finally {
      setConfirmDeleteId(null)
    }
  }
  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Кабинет HR</h1>
            <p className="text-sm text-muted-foreground">Добро пожаловать, {user?.email}</p>
          </div>
          <Button onClick={logout}>Выйти</Button>
        </div>
        <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border p-4">
            <h2 className="mb-3 text-lg font-semibold">Загрузить файл вакансии</h2>
            <div className="mb-3 text-sm text-muted-foreground">Загрузите файл с описанием вакансии — мы распарсим его через LLM и создадим черновик для утверждения.</div>
            <div className="grid gap-2">
              <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={uploading} />
              <div className="flex items-center gap-3">
                <Button onClick={onUpload} disabled={uploading || !file}>Загрузить и распарсить</Button>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Распознаём файл...
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <h2 className="mb-3 text-lg font-semibold">Сгенерировать по брифу</h2>
            <div className="grid gap-2">
              <Input placeholder="Название" value={genTitle} onChange={(e)=>setGenTitle(e.target.value)} />
              <Input placeholder="Seniority (Junior/Middle/Senior)" value={genSeniority} onChange={(e)=>setGenSeniority(e.target.value)} />
              <Textarea placeholder="Ключевые пункты (каждый с новой строки)" value={genHighlights} onChange={(e)=>setGenHighlights(e.target.value)} />
              <div className="flex items-center gap-3">
                <Button disabled={generating || (!genTitle && !genHighlights.trim())} onClick={async ()=>{
                  setGenerating(true)
                  try{
                    const created = await generateVacancy({ title: genTitle || undefined, seniority: genSeniority || undefined, highlights: genHighlights.split('\n').map(s=>s.trim()).filter(Boolean) })
                    setItems([created, ...items])
                    setGenTitle(''); setGenSeniority('Middle'); setGenHighlights('')
                    toast.success('Черновик сгенерирован')
                  }catch(e:any){toast.error(e?.message || 'Не удалось сгенерировать')}
                  finally{ setGenerating(false) }
                }}>Сгенерировать черновик</Button>
                {generating && <div className="text-sm text-muted-foreground">Генерируем описание…</div>}
              </div>
            </div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ваши вакансии</h2>
              <Button variant="ghost" onClick={refresh} disabled={loading}>Обновить</Button>
            </div>
            <div className="grid gap-3">
              {items.map(v => (
                <div key={v.id} className="rounded-lg border p-3">
                  {editingId === v.id ? (
                    <VacancyEdit initial={v} onCancel={() => setEditingId(null)} onSave={(payload) => onSave(v.id, payload)} />
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{formatTitle(v.title)} <span className="ml-2 text-xs text-muted-foreground">{v.seniority}</span></div>
                        <div className="flex gap-2 items-center">
                          <span className={`text-xs ${v.status === 'approved' ? 'text-green-600' : v.status === 'archived' ? 'text-gray-500' : 'text-amber-600'}`}>
                            {v.status === 'approved' ? 'утверждена' : v.status === 'archived' ? 'архив' : 'черновик'}
                          </span>
                          <Button variant="ghost" onClick={() => setEditingId(v.id)}>Редактировать</Button>
                          {v.status === 'draft' && (
                            <>
                              <Button onClick={() => onApprove(v.id)}>Утвердить</Button>
                              <Button variant="outline" onClick={() => onArchive(v.id)}>Архивировать</Button>
                              <Button variant="destructive" onClick={() => setConfirmDeleteId(v.id)}>Удалить</Button>
                            </>
                          )}
                          {v.status === 'approved' && (
                            <>
                              <Button onClick={() => onRevoke(v.id)}>Отозвать</Button>
                              <Button variant="outline" onClick={() => onArchive(v.id)}>Архивировать</Button>
                              {user?.role === 'admin' && (
                                <Button variant="destructive" onClick={() => setConfirmDeleteId(v.id)}>Удалить</Button>
                              )}
                            </>
                          )}
                          {v.status === 'archived' && (
                            <>
                              <Button onClick={() => onUnarchive(v.id)}>Вернуть</Button>
                              {user?.role === 'admin' && (
                                <Button variant="destructive" onClick={() => setConfirmDeleteId(v.id)}>Удалить</Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">{formatDescription(v.description)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Навыки: {v.skills.map(formatSkill).join(', ')}</div>
                      {v.details && Object.keys(v.details).length > 0 && (
                        <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                          {renderDetails(v.details)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
              {!items.length && <div className="text-sm text-muted-foreground">Пока нет вакансий</div>}
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-xl border p-4 mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Отклики на ваши вакансии</h2>
          <Button variant="ghost" onClick={refreshApps}>Обновить</Button>
        </div>
        <div className="grid gap-3">
          {apps.map(a => (
            <ApplicationRow key={a.id} app={a} onUpdated={(na)=> setApps(apps.map(x=> x.id===na.id? na: x))} />
          ))}
          {!apps.length && <div className="text-sm text-muted-foreground">Пока нет откликов</div>}
        </div>
      </div>
      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Удаление вакансии"
        description="Действие необратимо. Удалить вакансию?"
        confirmText="Удалить"
        destructive
        onConfirm={() => confirmDeleteId !== null && onDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}

function VacancyEdit({ initial, onCancel, onSave }: { initial: Vacancy, onCancel: () => void, onSave: (p: any) => void }) {
  const [title, setTitle] = useState(initial.title)
  const [description, setDescription] = useState(initial.description)
  const [seniority, setSeniority] = useState(initial.seniority)
  const [skills, setSkills] = useState(initial.skills.join(', '))
  const [technical, setTechnical] = useState(Number(initial.weights?.technical ?? 0.5))
  const [communication, setCommunication] = useState(Number(initial.weights?.communication ?? 0.3))
  const [cases, setCases] = useState(Number(initial.weights?.cases ?? 0.2))
  const [details, setDetails] = useState<Record<string, any>>(initial.details || {})

  return (
    <div className="grid gap-2">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      <Input value={seniority} onChange={(e) => setSeniority(e.target.value)} />
      <Input value={skills} onChange={(e) => setSkills(e.target.value)} />
      <div className="grid grid-cols-3 gap-2">
        <Input type="number" step="0.05" min="0" max="1" value={technical as any} onChange={(e) => setTechnical(Number(e.target.value))} />
        <Input type="number" step="0.05" min="0" max="1" value={communication as any} onChange={(e) => setCommunication(Number(e.target.value))} />
        <Input type="number" step="0.05" min="0" max="1" value={cases as any} onChange={(e) => setCases(Number(e.target.value))} />
      </div>
      {details && Object.keys(details).length > 0 && (
        <div className="mt-2 grid gap-2">
          <div className="text-sm font-medium">Дополнительные поля</div>
          {Object.keys(details).map((k) => (
            <div key={k} className="grid gap-1">
              <label className="text-xs text-muted-foreground">{detailLabel(k)}</label>
              <Input value={String(details[k] ?? '')} onChange={(e) => setDetails({ ...details, [k]: e.target.value })} />
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Button onClick={() => onSave({ title, description, seniority, skills: skills.split(',').map(s=>s.trim()).filter(Boolean), weights: { technical, communication, cases }, details: pruneEmpty(details) })}>Сохранить</Button>
        <Button variant="ghost" onClick={onCancel}>Отмена</Button>
      </div>
    </div>
  )
}

// --- UI helpers ---
const ACR = new Map<string, string>([
  ['lan','LAN'],['san','SAN'],['bios','BIOS'],['bmc','BMC'],['raid','RAID'],['cmdb','CMDB'],['dcim','DCIM'],['excel','Excel'],['word','Word'],['visio','Visio'],['x86','x86']
])

function formatTitle(s: string) {
  const t = (s || '').trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t
}

function formatDescription(s: string) {
  const text = (s || '').trim()
  if (!text) return text
  // Basic sentence capitalization and acronym formatting
  return text
    .split(/(?<=[\.!?])\s+/)
    .map(p => {
      let t = p.trim()
      if (!t) return ''
      t = t.charAt(0).toUpperCase() + t.slice(1)
      t = t.replace(/[A-Za-z0-9]{2,5}/g, w => ACR.get(w.toLowerCase()) || w)
      return t.endsWith('.') || t.endsWith('!') || t.endsWith('?') ? t : t + '.'
    })
    .filter(Boolean)
    .join(' ')
}

function formatSkill(s: string) {
  return ACR.get((s || '').toLowerCase()) || (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
}

function renderDetails(details: Record<string, any>) {
  const labels: Record<string, string> = {
    status: 'Статус',
    region: 'Регион',
    city: 'Город',
    address: 'Адрес',
    employment_type: 'Тип трудового договора',
    employment_format: 'Тип занятости',
    schedule_text: 'График/формат работы',
    income_month_rub: 'Доход (руб/мес)',
    salary_min_rub: 'Оклад мин. (руб/мес)',
    salary_max_rub: 'Оклад макс. (руб/мес)',
    annual_bonus_percent: 'Годовая премия (%)',
    bonus_type: 'Тип премирования',
    bonus_desc: 'Описание премирования',
    education_level: 'Уровень образования',
    experience: 'Опыт работы',
    travel_required: 'Командировки',
    languages: 'Языки',
    language_level: 'Уровень языка',
    extra_info: 'Дополнительно',
  }
  const order = Object.keys(labels).filter(k => details[k] !== undefined && details[k] !== null && String(details[k]).trim() !== '')
  if (!order.length) return null
  return order.map(key => (
    <div key={key} className="flex gap-2">
      <div className="w-56 text-foreground">{labels[key]}:</div>
      <div className="flex-1">{String(details[key])}</div>
    </div>
  ))
}

function detailLabel(key: string) {
  const map: Record<string, string> = {
    status: 'Статус',
    region: 'Регион',
    city: 'Город',
    address: 'Адрес',
    employment_type: 'Тип трудового договора',
    employment_format: 'Тип занятости',
    schedule_text: 'График/формат работы',
    income_month_rub: 'Доход (руб/мес)',
    salary_min_rub: 'Оклад мин. (руб/мес)',
    salary_max_rub: 'Оклад макс. (руб/мес)',
    annual_bonus_percent: 'Годовая премия (%)',
    bonus_type: 'Тип премирования',
    bonus_desc: 'Описание премирования',
    education_level: 'Уровень образования',
    experience: 'Опыт работы',
    travel_required: 'Командировки',
    languages: 'Языки',
    language_level: 'Уровень языка',
    extra_info: 'Дополнительно',
  }
  return map[key] || key
}

function pruneEmpty(obj: Record<string, any>) {
  const out: Record<string, any> = {}
  Object.entries(obj || {}).forEach(([k, v]) => {
    const sv = String(v ?? '').trim()
    if (sv !== '') out[k] = sv
  })
  return out
}

function ApplicationRow({ app, onUpdated }: { app: Application; onUpdated: (a: Application)=>void }) {
  const [loading, setLoading] = useState(false)
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="text-sm">
          <div className="font-medium">Вакансия #{app.vacancy_id}</div>
          <div className="text-xs text-muted-foreground">Статус: {app.status} {app.match_score!=null? `· Оценка: ${app.match_score}`:''} {app.verdict? `· Решение: ${app.verdict}`:''} {app.status==='invited' ? '· Допуск: да' : '· Допуск: нет'}</div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={loading} onClick={async ()=>{ setLoading(true); try{ const na = await reassessApplication(app.id); onUpdated(na) } finally { setLoading(false) } }}>{loading ? 'Оцениваем…' : 'Переоценить ИИ'}</Button>
        </div>
      </div>
      {app.profile_snapshot && (
        <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
          {app.profile_snapshot.summary && <div><span className="text-foreground">Резюме: </span>{app.profile_snapshot.summary}</div>}
          {Array.isArray(app.profile_snapshot.skills) && app.profile_snapshot.skills.length>0 && (
            <div><span className="text-foreground">Навыки: </span>{app.profile_snapshot.skills.join(', ')}</div>
          )}
        </div>
      )}
      {app.notes && <div className="mt-2 text-xs">Комментарий ИИ: {app.notes}</div>}
    </div>
  )
}
