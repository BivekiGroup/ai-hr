import { Separator } from "@/components/ui/separator"

const steps = [
  {
    title: 'Создание вакансии',
    desc: 'HR задаёт требования и веса компетенций. Формируется профиль.'
  },
  {
    title: 'Скрининг резюме',
    desc: 'Парсер извлекает опыт и навыки, строит первичный скоринг.'
  },
  {
    title: 'Интервью',
    desc: 'Голос/чат, адаптивные вопросы, ASR partials и просодика.'
  },
  {
    title: 'Скоринг и отчёт',
    desc: 'Сводный балл, объяснимость, фидбек кандидату, нотификации.'
  }
]

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 py-12 md:py-20">
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <h2 className="text-2xl font-bold md:text-4xl">Как это работает</h2>
        <p className="mt-2 text-muted-foreground">Энд‑ту‑энд процесс от вакансии до отчёта</p>
      </div>
      <div className="grid gap-6 md:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.title} className="rounded-lg border p-6">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {i + 1}
            </div>
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <Separator className="my-3" />
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
