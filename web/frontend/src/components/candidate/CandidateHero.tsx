import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function CandidateHero() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <Badge className="mb-4">Онлайн‑интервью с ИИ</Badge>
        <h1 className="bg-gradient-to-r from-primary to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent md:text-6xl">
          Готов(а) пройти интервью?
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
          10–15 минут. Вопросы по вашему резюме и вакансии. В конце — персональная обратная связь.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a href="/signup"><Button size="lg">Начать</Button></a>
          <a href="#mic"><Button size="lg" variant="ghost">Проверить микрофон</Button></a>
        </div>
      </div>
    </section>
  )
}

