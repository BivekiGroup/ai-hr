import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

export default function SignupPage() {
  const nav = useNavigate()
  const { signup } = useAuth()
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
  })
  type Form = z.infer<typeof schema>
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    try {
      await signup(name, email, password)
      toast.success('Аккаунт создан')
      nav('/user', { replace: true })
    } catch (err: any) {
      toast.error('Не удалось зарегистрироваться (email занят?)')
    }
  })

  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-4">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Регистрация</h1>
        <p className="text-sm text-muted-foreground">Создаётся аккаунт пользователя (кандидата)</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input placeholder="Имя" {...register('name')} />
        {errors.name && <div className="text-xs text-red-500">{errors.name.message}</div>}
        <Input placeholder="you@company.com" type="email" {...register('email')} />
        {errors.email && <div className="text-xs text-red-500">{errors.email.message}</div>}
        <Input placeholder="Пароль" type="password" {...register('password')} />
        {errors.password && <div className="text-xs text-red-500">{errors.password.message}</div>}
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Создаём…' : 'Зарегистрироваться'}</Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Уже есть аккаунт? <Link to="/login" className="underline">Войти</Link>
      </p>
    </div>
  )
}
