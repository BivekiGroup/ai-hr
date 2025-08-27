import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { vacancies } from "@/data/mock"

export function Vacancies() {
  return (
    <section id="vacancies" className="mx-auto max-w-7xl px-4 py-12 md:py-20">
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <h2 className="text-2xl font-bold md:text-4xl">Готовые вакансии для демо</h2>
        <p className="mt-2 text-muted-foreground">Заглушки данных для демонстрации — можно сразу запускать интервью</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {vacancies.map((v) => (
          <Card key={v.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{v.title}</CardTitle>
                <Badge>{v.seniority}</Badge>
              </div>
              <CardDescription>{v.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {v.skills.map((s) => (
                  <span key={s} className="rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                    {s}
                  </span>
                ))}
              </div>
              {typeof v.score === 'number' && (
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>Матч</span>
                    <span>{v.score}%</span>
                  </div>
                  <Progress value={v.score} />
                </div>
              )}
            </CardContent>
            <CardFooter className="mt-auto justify-between">
              <Button variant="ghost">Детали</Button>
              <Button>Старт интервью</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
