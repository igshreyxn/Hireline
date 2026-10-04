import { useEffect, useState } from 'react'

// Shown once per visit, even though App renders it on both the login and main screens.
let shownThisVisit = false

// Title screen shown when the app opens. Tap, click or press any key to skip.
export default function Splash() {
  const [leaving, setLeaving] = useState(shownThisVisit)
  const [gone, setGone] = useState(shownThisVisit)

  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const t = setTimeout(() => setLeaving(true), reduce ? 1200 : 2900)
    const onKey = () => setLeaving(true)
    window.addEventListener('keydown', onKey, { once: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (!leaving) return
    shownThisVisit = true
    const t = setTimeout(() => setGone(true), 700)
    return () => clearTimeout(t)
  }, [leaving])

  if (gone) return null
  return (
    <div className={'splash' + (leaving ? ' out' : '')} role="presentation" onClick={() => setLeaving(true)}>
      <div className="splash-in">
        <div className="splash-mark">H</div>
        <h1>Hireline</h1>
        <p>The recruitment desk, from job portal to signed offer.</p>
        <div className="splash-track">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${(0.7 + i * 0.13).toFixed(2)}s` }} />
          ))}
        </div>
        <div className="splash-ends">
          <span>Sourced</span>
          <span>Signed</span>
        </div>
      </div>
      <small>Tap anywhere to continue</small>
    </div>
  )
}
