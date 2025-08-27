import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

export default function UserDashboard() {
  const { user, logout } = useAuth()
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Личный кабинет</h1>
        <div className="text-sm text-muted-foreground">{user?.email}</div>
      </div>
      <div className="rounded-xl border p-6">
        <p className="text-sm text-muted-foreground">
          Здесь пользователь (кандидат) сможет загрузить резюме и пройти интервью. Пока — заглушка.
        </p>
      </div>
      <div className="mt-8">
        <Button onClick={logout}>Выйти</Button>
      </div>
    </div>
  )
}

