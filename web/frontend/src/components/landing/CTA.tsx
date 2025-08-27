import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CTA() {
  return (
    <section id="demo" className="mx-auto max-w-7xl px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-xl border bg-card p-6 text-center">
        <h3 className="text-2xl font-bold">Запустите демо за 1 минуту</h3>
        <p className="mt-2 text-muted-foreground">Оставьте email — пришлём стенд и тестовые данные</p>
        <form className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Input placeholder="you@company.com" type="email" required />
          <Button type="submit" className="shrink-0">Получить доступ</Button>
        </form>
      </div>
    </section>
  )
}
