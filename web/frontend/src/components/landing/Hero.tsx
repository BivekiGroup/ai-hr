import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function Hero() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <div className="mx-auto max-w-4xl text-center">
        <Badge className="mb-4">Скрининг и интервью с ИИ</Badge>
        <h1 className="bg-gradient-to-r from-primary to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-6xl">
          HR‑аватар: скрининг резюме, интервью и объяснимый скоринг
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-muted-foreground md:text-xl">
          Сократите время первичного отбора на 40% и повышайте точность попадания в профиль. Голос/чат, прозрачный скоринг и понятные отчёты.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg">Запустить демо</Button>
          <Button size="lg" variant="ghost">Смотреть отчёт</Button>
        </div>
        <Separator className="my-10" />
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground md:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold text-foreground">−40%</div>
            Время скрининга
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold text-foreground">0.8+</div>
            Precision@TopN
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold text-foreground">≤1.5 c</div>
            Ответ ассистента
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold text-foreground">99%</div>
            SLA стенда
          </div>
        </div>
      </div>
    </section>
  )
}
