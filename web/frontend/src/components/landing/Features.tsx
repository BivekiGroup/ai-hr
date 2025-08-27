import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { features } from "@/data/mock"

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-12 md:py-20">
      <div className="mx-auto mb-8 max-w-3xl text-center">
        <h2 className="text-2xl font-bold md:text-4xl">Возможности</h2>
        <p className="mt-2 text-muted-foreground">От автоскрининга резюме до голосового интервью и объяснимого скоринга</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <Card key={f.title} className="h-full">
            <CardHeader>
              <Badge className="w-max">{f.tag}</Badge>
              <CardTitle className="mt-3">{f.title}</CardTitle>
              <CardDescription>{f.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc text-sm text-muted-foreground">
                <li>API‑first, FastAPI</li>
                <li>Обсервабилити: Prometheus/Grafana</li>
                <li>Хранилище: Postgres, Redis, S3</li>
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
