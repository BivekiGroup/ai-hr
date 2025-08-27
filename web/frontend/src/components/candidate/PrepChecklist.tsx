import { CheckCircle2 } from "lucide-react"

const items = [
  'Тихое место и стабильный интернет',
  'Наушники/гарнитура (желательно)',
  'Проверьте микрофон (ниже по странице)',
  'Под рукой — резюме в PDF/DOC',
  '15 минут свободного времени',
  'Согласие на обработку данных',
]

export function PrepChecklist() {
  return (
    <section id="prep" className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-2xl font-bold md:text-3xl">Подготовка к интервью</h2>
        <p className="mt-2 text-muted-foreground">Быстрый чек‑лист перед стартом</p>
      </div>
      <div className="mx-auto mt-6 grid max-w-3xl gap-3">
        {items.map((t) => (
          <div key={t} className="flex items-center gap-3 rounded-lg border p-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <span>{t}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

