import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { listPublicVacancies, type Vacancy } from '@/api/vacancies'

export function VacancyPicker() {
  const [items, setItems] = useState<Vacancy[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try { setItems(await listPublicVacancies()) } finally { setLoading(false) }
    }
    run()
  }, [])
  const labels: Record<string, string> = {
    region: 'Регион', city: 'Город', address: 'Адрес', employment_type: 'Тип договора', employment_format: 'Тип занятости', schedule_text: 'График', income_month_rub: 'Доход', salary_min_rub: 'Оклад мин.', salary_max_rub: 'Оклад макс.', annual_bonus_percent: 'Годовая премия (%)', education_level: 'Образование', experience: 'Опыт', languages: 'Языки', language_level: 'Уровень языка', extra_info: 'Дополнительно'
  }
  return (
    <section id="resume" className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="mx-auto mb-6 max-w-3xl text-center">
        <h2 className="text-2xl font-bold md:text-3xl">Выберите направление</h2>
        <p className="mt-2 text-muted-foreground">Это поможет задать релевантные вопросы</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((v) => (
          <Card key={v.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{v.title}</CardTitle>
              <CardDescription>{v.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              {v.details && Object.keys(v.details).length > 0 && (
                <div className="mb-3 grid gap-1 text-xs text-muted-foreground">
                  {Object.entries(v.details).map(([k,val]) => (
                    <div key={k} className="flex gap-2"><div className="w-36 text-foreground">{labels[k] || k}:</div><div className="flex-1">{String(val)}</div></div>
                  ))}
                </div>
              )}
              <Button className="w-full">Выбрать</Button>
            </CardContent>
          </Card>
        ))}
        {!items.length && !loading && (
          <div className="text-sm text-muted-foreground">Нет доступных вакансий</div>
        )}
      </div>
    </section>
  )
}
