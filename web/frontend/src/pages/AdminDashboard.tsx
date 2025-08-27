import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'
import { api } from '@/api/client'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
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
      <div className="mt-8">
        <Button onClick={logout}>Выйти</Button>
      </div>
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
