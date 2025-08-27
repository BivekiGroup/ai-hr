import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

export default function LoginPage() {
  const nav = useNavigate()
  const { login } = useAuth()
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  })
  type Form = z.infer<typeof schema>
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await login(email, password)
      toast.success('Вход выполнен')
      // decide route by role
      const access = localStorage.getItem('access_token')
      if (access) {
        try {
          const payload: any = JSON.parse(atob(access.split('.')[1]))
          const role = payload.role
          if (role === 'admin') nav('/admin', { replace: true })
          else if (role === 'hr') nav('/hr', { replace: true })
          else nav('/user', { replace: true })
        } catch {
          nav('/user', { replace: true })
        }
      } else {
        nav('/user', { replace: true })
      }
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('name_not_resolved') || msg.toLowerCase().includes('net::err')) {
        toast.error('Нет соединения с API')
      } else {
        toast.error('Неверный email или пароль')
      }
    }
  })

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Вход</h1>
        <p className="text-sm text-muted-foreground">Используйте email и пароль</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input placeholder="you@company.com" type="email" {...register('email')} />
        {errors.email && <div className="text-xs text-red-500">{errors.email.message}</div>}
        <Input placeholder="Пароль" type="password" {...register('password')} />
        {errors.password && <div className="text-xs text-red-500">{errors.password.message}</div>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Входим…' : 'Войти'}</Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Нет аккаунта? <Link to="/signup" className="underline">Зарегистрироваться</Link>
      </p>
    </div>
  )
}
