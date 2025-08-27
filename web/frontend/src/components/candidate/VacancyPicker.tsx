import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { vacancies } from "@/data/mock"

export function VacancyPicker() {
  return (
    <section id="resume" className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="mx-auto mb-6 max-w-3xl text-center">
        <h2 className="text-2xl font-bold md:text-3xl">Выберите направление</h2>
        <p className="mt-2 text-muted-foreground">Это поможет задать релевантные вопросы</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {vacancies.map((v) => (
          <Card key={v.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{v.title}</CardTitle>
              <CardDescription>{v.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button className="w-full">Выбрать</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

