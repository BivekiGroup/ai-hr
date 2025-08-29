import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/api/client'
import { toast } from 'sonner'
import { deleteVacancy, listUsers, listVacancies, type Vacancy, type User } from '@/api/vacancies'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const [u, v] = await Promise.all([listUsers('hr'), listVacancies()])
        setUsers(u)
        setVacancies(v)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const byOwner = useMemo(() => {
    const map = new Map<number, Vacancy[]>()
    for (const v of vacancies) {
      const arr = map.get(v.owner_id) || []
      arr.push(v)
      map.set(v.owner_id, arr)
    }
    return map
  }, [vacancies])

  // no-op mapping removed; keep component strict-clean

  async function onDelete(id: number) {
    try {
      await deleteVacancy(id)
      setVacancies(vacancies.filter(v => v.id !== id))
      toast.success('Вакансия удалена')
    } catch (e: any) {
      toast.error(e?.message || 'Не удалось удалить вакансию')
    } finally {
      setConfirmDeleteId(null)
    }
  }
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Админ-панель</h1>
        <div className="text-sm text-muted-foreground">{user?.email}</div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-6">
          <h3 className="font-semibold">Модели и версии</h3>
          <p className="text-sm text-muted-foreground">Управление моделью ASR/NLP, фичфлагами</p>
        </div>
        <div className="rounded-xl border p-6">
          <h3 className="font-semibold">Онтология навыков</h3>
          <p className="text-sm text-muted-foreground">Синонимы, связи, весовые коэффициенты</p>
        </div>
        <CreateHRCard />
      </div>

      <div className="mt-8 rounded-xl border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Вакансии всех HR</h3>
          <Button variant="ghost" disabled={loading} onClick={async ()=>{ setLoading(true); try { const [u,v]= await Promise.all([listUsers('hr'), listVacancies()]); setUsers(u); setVacancies(v);} finally { setLoading(false)} }}>{loading ? 'Обновляем…' : 'Обновить'}</Button>
        </div>
        <div className="grid gap-4">
          {users.map(u => (
            <div key={u.id} className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-medium">{u.name} <span className="text-muted-foreground">({u.email})</span></div>
              <div className="grid gap-2">
                {(byOwner.get(u.id) || []).map(v => (
                  <div key={v.id} className="rounded-md border p-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <div className="font-medium">{v.title} <span className="ml-2 text-xs text-muted-foreground">{v.seniority}</span></div>
                        <div className="text-xs text-muted-foreground">Статус: {v.status}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="destructive" onClick={() => setConfirmDeleteId(v.id)}>Удалить</Button>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-3">{v.description}</div>
                    <div className="mt-1 text-xs">Навыки: {v.skills.join(', ')}</div>
                    {v.details && Object.keys(v.details).length > 0 && (
                      <div className="mt-1 grid gap-1 text-xs text-muted-foreground">
                        {Object.entries(v.details).slice(0,8).map(([k,val]) => (
                          <div key={k} className="flex gap-2"><div className="w-44 text-foreground">{k}:</div><div className="flex-1">{String(val)}</div></div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {!(byOwner.get(u.id) || []).length && (
                  <div className="text-xs text-muted-foreground">Нет вакансий</div>
                )}
              </div>
            </div>
          ))}
          {!users.length && <div className="text-sm text-muted-foreground">HR-пользователей нет</div>}
        </div>
      </div>
      <div className="mt-8">
        <Button onClick={logout}>Выйти</Button>
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

function CreateHRCard() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api('/auth/create-hr', { method: 'POST', body: { name, email, password } })
      toast.success('HR создан')
      setName(''); setEmail(''); setPassword('')
    } catch (err: any) {
      toast.error('Не удалось создать HR: ' + (err?.message || 'ошибка'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border p-6">
      <h3 className="font-semibold">Пользователи</h3>
      <p className="mb-3 text-sm text-muted-foreground">Создание HR-аккаунтов</p>
      <form className="space-y-2" onSubmit={onSubmit}>
        <Input placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input placeholder="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" disabled={loading}>{loading ? 'Создание…' : 'Создать HR'}</Button>
      </form>
    </div>
  )
}
