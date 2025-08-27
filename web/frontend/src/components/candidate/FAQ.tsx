const qa = [
  { q: 'Сколько длится интервью?', a: 'Обычно 10–15 минут.' },
  { q: 'Можно ли переспросить?', a: 'Да, ассистент повторит или переформулирует вопрос.' },
  { q: 'Будет ли видео?', a: 'Только голос или чат — по вашему выбору.' },
  { q: 'Что с данными?', a: 'Мы бережно храним и используем их только для интервью и обратной связи.' },
]

export function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="mx-auto mb-6 max-w-3xl text-center">
        <h2 className="text-2xl font-bold md:text-3xl">Частые вопросы</h2>
      </div>
      <div className="mx-auto max-w-3xl divide-y rounded-xl border">
        {qa.map((p) => (
          <div key={p.q} className="p-4">
            <div className="font-medium">{p.q}</div>
            <div className="mt-1 text-sm text-muted-foreground">{p.a}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

