import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import { listPublicVacancies, type Vacancy, getMyProfile, uploadProfileFile, generateProfile, type Profile, applyToVacancy, listMyApplications, type Application } from '@/api/vacancies'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function UserDashboard() {
  const { user, logout } = useAuth()
  const [items, setItems] = useState<Vacancy[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [apps, setApps] = useState<Application[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [genBrief, setGenBrief] = useState('')
  const [generating, setGenerating] = useState(false)
  const [evaluating, setEvaluating] = useState<Record<number, boolean>>({})
  useEffect(() => { listPublicVacancies().then(setItems).catch(()=>{}) }, [])
  useEffect(() => { getMyProfile().then(setProfile).catch(()=>{}) }, [])
  useEffect(() => { listMyApplications().then(setApps).catch(()=>{}) }, [])
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Личный кабинет</h1>
        <div className="text-sm text-muted-foreground">{user?.email}</div>
      </div>
      <div className="rounded-xl border p-6">
        <div className="mb-3 text-sm font-medium">Доступные вакансии</div>
        <div className="grid gap-2">
          {items.map(v => {
            const applied = apps.some(a => a.vacancy_id === v.id)
            return (
              <div key={v.id} className="rounded-md border p-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{v.title} <span className="ml-2 text-xs text-muted-foreground">{v.seniority}</span></div>
                  <div>
                    <Button size="sm" disabled={applied} onClick={async ()=>{
                      try{
                        const a= await applyToVacancy(v.id)
                        setApps([a, ...apps])
                        toast.info('Отклик отправлен, ИИ оценивает…')
                        // start short polling for this vacancy's application to get assessed/invited
                        setEvaluating(prev => ({...prev, [v.id]: true}))
                        const started = Date.now()
                        const poll = async () => {
                          const list = await listMyApplications()
                          setApps(list)
                          const mine = list.find(x => x.vacancy_id === v.id)
                          if (mine && mine.status !== 'applied') {
                            setEvaluating(prev => ({...prev, [v.id]: false}))
                            const ok = mine.status === 'invited'
                            toast[ok ? 'success' : 'warning'](ok ? 'Вы допущены до звонка' : 'Оценка готова')
                            return
                          }
                          if (Date.now() - started < 30000) {
                            setTimeout(poll, 2000)
                          } else {
                            setEvaluating(prev => ({...prev, [v.id]: false}))
                            toast.message('Оценка скоро будет готова', { description: 'Зайдите позже, мы уведомим в откликах.' })
                          }
                        }
                        setTimeout(poll, 1500)
                      } catch(e:any){ toast.error(e?.message || 'Не удалось откликнуться') }
                    }}>{applied ? 'Отклик отправлен' : 'Откликнуться'}</Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{v.description}</div>
                {evaluating[v.id] && <div className="mt-1 text-xs text-muted-foreground">Оцениваем соответствие…</div>}
                <div className="mt-1 text-xs">Навыки: {v.skills.join(', ')}</div>
                {v.details && Object.keys(v.details).length > 0 && (
                  <div className="mt-1 grid gap-1 text-xs text-muted-foreground">
                    {Object.entries(v.details).map(([k,val]) => (
                      <div key={k} className="flex gap-2"><div className="w-44 text-foreground">{k}:</div><div className="flex-1">{String(val)}</div></div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {!items.length && <div className="text-sm text-muted-foreground">Пока нет вакансий</div>}
        </div>
      </div>
      <div className="mt-6 rounded-xl border p-6">
        <div className="mb-3 text-sm font-medium">Мои отклики</div>
        <div className="grid gap-2">
          {apps.map(a => {
            const v = items.find(x => x.id === a.vacancy_id)
            return (
              <div key={a.id} className="rounded-md border p-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{v?.title || `Вакансия #${a.vacancy_id}`}</div>
                  <div className="text-muted-foreground">Статус: {a.status}{a.match_score != null ? ` · Оценка: ${Math.round((a.match_score||0)*100)/100}` : ''}{a.verdict ? ` · Решение: ${a.verdict}` : ''} {a.status==='invited' ? '· Допуск: да' : '· Допуск: нет'}</div>
                </div>
                {a.notes && <div className="mt-1 text-muted-foreground">Комментарий: {a.notes}</div>}
              </div>
            )
          })}
          {!apps.length && <div className="text-sm text-muted-foreground">Откликов пока нет</div>}
        </div>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border p-4">
          <div className="mb-2 text-lg font-semibold">Мой профиль</div>
          {profile ? (
            <div className="grid gap-2 text-sm">
              <div className="text-foreground">Резюме</div>
              <div className="text-muted-foreground">{profile.summary}</div>
              <div className="text-foreground">Навыки</div>
              <div>{profile.skills.join(', ')}</div>
              {profile.details && Object.keys(profile.details).length > 0 && (
                <div className="grid gap-1 text-xs text-muted-foreground mt-2">
                  {Object.entries(profile.details).slice(0,12).map(([k,v]) => (
                    <div key={k} className="flex gap-2"><div className="w-44 text-foreground">{k}:</div><div className="flex-1">{String(v)}</div></div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Профиль пока не создан</div>
          )}
        </div>
        <div className="rounded-xl border p-4">
          <div className="mb-2 text-lg font-semibold">Загрузить резюме</div>
          <div className="grid gap-2">
            <Input type="file" onChange={(e)=> setFile(e.target.files?.[0] ?? null)} disabled={uploading} />
            <div className="flex items-center gap-3">
              <Button disabled={!file || uploading} onClick={async ()=>{ if(!file) return; setUploading(true); try{ const p= await uploadProfileFile(file); setProfile(p); setFile(null); toast.success('Профиль обновлён'); } catch(e:any){ toast.error(e?.message || 'Не удалось распознать резюме'); } finally { setUploading(false) } }}>Распознать</Button>
              {uploading && <div className="text-sm text-muted-foreground">Распознаём…</div>}
            </div>
          </div>
          <div className="my-4 h-px bg-border" />
          <div className="mb-2 text-lg font-semibold">Сгенерировать</div>
          <Textarea placeholder="Коротко о себе и ключевые пункты (каждый с новой строки)" value={genBrief} onChange={(e)=> setGenBrief(e.target.value)} />
          <div className="mt-2 flex items-center gap-3">
            <Button disabled={generating || !genBrief.trim()} onClick={async ()=>{ setGenerating(true); try{ const p = await generateProfile({ summary: genBrief, highlights: genBrief.split('\n').map(s=>s.trim()).filter(Boolean) }); setProfile(p); setGenBrief(''); toast.success('Профиль сгенерирован'); } catch(e:any){ toast.error(e?.message || 'Не удалось сгенерировать'); } finally { setGenerating(false) } }}>Сгенерировать профиль</Button>
            {generating && <div className="text-sm text-muted-foreground">Генерируем…</div>}
          </div>
        </div>
      </div>
      <div className="mt-8">
        <Button onClick={logout}>Выйти</Button>
      </div>
    </div>
  )
}
