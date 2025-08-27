import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function MicTest() {
  const [status, setStatus] = useState<'idle' | 'ok' | 'fail'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function test() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      setStatus('ok')
    } catch (e: any) {
      setStatus('fail')
      setError('Нет доступа к микрофону. Разрешите доступ в браузере.')
    }
  }

  return (
    <section id="mic" className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="mx-auto mb-6 max-w-3xl text-center">
        <h2 className="text-2xl font-bold md:text-3xl">Тест микрофона</h2>
        <p className="mt-2 text-muted-foreground">Проверьте, что браузер слышит вас</p>
      </div>
      <div className="mx-auto max-w-xl rounded-xl border p-6 text-center">
        <Button onClick={test}>Проверить</Button>
        <div className="mt-3 text-sm">
          {status === 'ok' && <span className="text-green-600">Микрофон работает</span>}
          {status === 'fail' && <span className="text-red-600">{error}</span>}
          {status === 'idle' && <span className="text-muted-foreground">Нажмите «Проверить»</span>}
        </div>
      </div>
    </section>
  )
}

