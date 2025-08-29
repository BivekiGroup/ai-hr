import { useEffect, useState } from 'react'

export function TopProgress() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    function onLoad(e: any) {
      const d = e?.detail?.delta || 0
      setCount((c) => Math.max(0, c + d))
    }
    window.addEventListener('apiload', onLoad as any)
    return () => window.removeEventListener('apiload', onLoad as any)
  }, [])
  return (
    <div className={`fixed left-0 right-0 top-0 z-50 h-0.5 bg-transparent ${count>0 ? '' : 'opacity-0'}`}>
      <div className="h-full w-full animate-[indeterminate_1.2s_ease_infinite] bg-primary" style={{ transformOrigin: '0% 50%' }} />
      <style>{`@keyframes indeterminate { 0%{ transform: translateX(-100%) scaleX(0.3)} 50%{ transform: translateX(0%) scaleX(0.7)} 100%{ transform: translateX(100%) scaleX(0.3)} }`}</style>
    </div>
  )
}

