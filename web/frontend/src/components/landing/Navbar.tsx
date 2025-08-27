import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

export function Navbar() {
  const { user, logout } = useAuth()
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <a href="#" className="flex items-center gap-2 font-semibold">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs">AI</span>
          <span>HR Avatar</span>
        </a>
        <nav className="hidden gap-6 text-sm md:flex">
          <a href="#prep" className="text-muted-foreground hover:text-foreground">Подготовка</a>
          <a href="#resume" className="text-muted-foreground hover:text-foreground">Резюме</a>
          <a href="#mic" className="text-muted-foreground hover:text-foreground">Тест аудио</a>
          <a href="#faq" className="text-muted-foreground hover:text-foreground">FAQ</a>
        </nav>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground md:inline">{user.email} · {user.role}</span>
            {user.role === 'admin' && <a href="/admin"><Button variant="ghost">Админ</Button></a>}
            {user.role === 'hr' && <a href="/hr"><Button variant="ghost">HR</Button></a>}
            {user.role === 'candidate' && <a href="/user"><Button variant="ghost">ЛК</Button></a>}
            <Button onClick={logout}>Выйти</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <a href="/login"><Button variant="ghost" className="hidden md:inline-flex">Войти</Button></a>
            <a href="/signup"><Button>Регистрация</Button></a>
          </div>
        )}
      </div>
    </header>
  )
}
