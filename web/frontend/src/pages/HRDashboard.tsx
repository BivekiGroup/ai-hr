import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { createVacancy, listVacancies, updateVacancy, type Vacancy } from '@/api/vacancies'

export default function HRDashboard() {
  const { user, logout } = useAuth()
  const [items, setItems] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', seniority: 'Middle', skills: '', technical: 0.5, communication: 0.3, cases: 0.2 })
  const [editingId, setEditingId] = useState<number | null>(null)

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

  function toPayload() {
    const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean)
    return {
      title: form.title,
      description: form.description,
      seniority: form.seniority,
      skills,
      weights: { technical: Number(form.technical), communication: Number(form.communication), cases: Number(form.cases) },
    }
  }

  async function onCreate() {
    const payload = toPayload()
    const created = await createVacancy(payload)
    setItems([created, ...items])
    setForm({ title: '', description: '', seniority: 'Middle', skills: '', technical: 0.5, communication: 0.3, cases: 0.2 })
  }

  async function onSave(id: number, payload: any) {
    const upd = await updateVacancy(id, payload)
    setItems(items.map(i => i.id === id ? upd : i))
    setEditingId(null)
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
            <h2 className="mb-3 text-lg font-semibold">Создать вакансию</h2>
            <div className="grid gap-2">
              <Input placeholder="Название" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <Textarea placeholder="Описание" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input placeholder="Seniority (Junior/Middle/Senior)" value={form.seniority} onChange={(e) => setForm({ ...form, seniority: e.target.value })} />
              <Input placeholder="Навыки (через запятую)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" step="0.05" min="0" max="1" placeholder="technical" value={form.technical as any} onChange={(e) => setForm({ ...form, technical: Number(e.target.value) })} />
                <Input type="number" step="0.05" min="0" max="1" placeholder="communication" value={form.communication as any} onChange={(e) => setForm({ ...form, communication: Number(e.target.value) })} />
                <Input type="number" step="0.05" min="0" max="1" placeholder="cases" value={form.cases as any} onChange={(e) => setForm({ ...form, cases: Number(e.target.value) })} />
              </div>
              <Button onClick={onCreate} disabled={loading || !form.title || !form.description}>Создать</Button>
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
                        <div className="font-semibold">{v.title} <span className="ml-2 text-xs text-muted-foreground">{v.seniority}</span></div>
                        <Button variant="ghost" onClick={() => setEditingId(v.id)}>Редактировать</Button>
                      </div>
                      <div className="text-sm text-muted-foreground">{v.description}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Навыки: {v.skills.join(', ')}</div>
                    </>
                  )}
                </div>
              ))}
              {!items.length && <div className="text-sm text-muted-foreground">Пока нет вакансий</div>}
            </div>
          </div>
        </div>
      </div>
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
      <div className="flex gap-2">
        <Button onClick={() => onSave({ title, description, seniority, skills: skills.split(',').map(s=>s.trim()).filter(Boolean), weights: { technical, communication, cases } })}>Сохранить</Button>
        <Button variant="ghost" onClick={onCancel}>Отмена</Button>
      </div>
    </div>
  )
}
