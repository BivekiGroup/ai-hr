const steps = [
  { title: 'Загрузка резюме', desc: 'Подтянем навыки и опыт' },
  { title: 'Вопросы по профилю', desc: 'Короткие, по сути, можно переспросить' },
  { title: 'Завершение', desc: 'Итоги и персональная обратная связь' },
]

export function Steps() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="mx-auto mb-6 max-w-3xl text-center">
        <h2 className="text-2xl font-bold md:text-3xl">Как проходит интервью</h2>
        <p className="mt-2 text-muted-foreground">Простой и прозрачный процесс</p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="rounded-xl border p-6">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {i + 1}
            </div>
            <h3 className="text-lg font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

