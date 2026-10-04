import { useState } from 'react'
import { DEMO_PASSWORD, ROLES } from '../constants.js'
import { authMessage } from '../backend/useFirebaseBackend.js'
import Avatar from './Avatar.jsx'

const noAuto = { autoCapitalize: 'none', autoCorrect: 'off', spellCheck: false }

export default function Login({ backend }) {
  const demo = backend.mode === 'local'
  const [tab, setTab] = useState('signin') // signin | signup | reset
  const [name, setName] = useState('')
  const [email, setEmail] = useState(demo ? 'senior@demo.hire' : '')
  const [password, setPassword] = useState(demo ? DEMO_PASSWORD : '')
  const [remember, setRemember] = useState(true)
  const [companyMode, setCompanyMode] = useState('join') // join | create
  const [company, setCompany] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async (fn) => {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      setError(authMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (tab === 'reset') {
      if (!email.trim()) return setError('Enter the email you signed up with.')
      return run(async () => {
        await backend.resetPassword(email)
        setInfo('Check your inbox for a link to set a new password.')
      })
    }
    if (!email.trim() || !password) return setError('Enter your email and password.')
    if (tab === 'signup') {
      if (!name.trim()) return setError('Enter your name.')
      if (!demo && companyMode === 'create' && !company.trim()) return setError('Enter your company’s name.')
      if (!demo && companyMode === 'join' && code.replace(/[^a-z0-9]/gi, '').length < 6) return setError('Enter the 6-character company code from your Admin.')
      const choice = companyMode === 'create' ? { mode: 'create', company } : { mode: 'join', code }
      return run(() => backend.signUp(name, email, password, remember, choice))
    }
    return run(() => backend.signIn(email, password, remember))
  }

  const switchTab = (t) => {
    setTab(t)
    setError('')
    setInfo('')
    if (t === 'signup' && demo) {
      setEmail('')
      setPassword('')
    }
  }

  const demoMembers = demo
    ? Object.entries(backend.data.team).filter(([, u]) => u.password === DEMO_PASSWORD && u.email?.endsWith('@demo.hire'))
    : []

  const titles = { signin: 'Sign in', signup: 'Create your account', reset: 'Reset your password' }
  const blurbs = {
    signin: 'Welcome back. Sign in to your recruitment desk.',
    signup: demo
      ? 'In demo mode new accounts wait for the demo Admin (admin@demo.hire) to approve them.'
      : 'Starting Hireline for your firm? Create a new company and you become its Admin. Joining your team? Use the company code your Admin shared.',
    reset: 'We’ll email you a link to choose a new password.',
  }

  return (
    <div className="login-wrap">
      <div className="login">
        <section className="login-side">
          <div style={{ fontFamily: 'var(--display)', fontSize: 15, opacity: 0.9 }}>Hireline</div>
          <h1>Every candidate, from job portal to signed offer.</h1>
          <p>
            One shared desk for the recruiting team: client requirements, screening calls, profiles sent to clients,
            feedback and the 24-hour offer window.
          </p>
          <ol className="flow">
            <li>Client HR shares the role, salary band and skills</li>
            <li>Junior HRs source on job portals and screen on a call</li>
            <li>Senior HR briefs the candidate on the role</li>
            <li>Profile goes to the client; we chase feedback</li>
            <li>G-Meet with our HR, then 24 hours to sign the letter</li>
          </ol>
        </section>

        <section className="login-main">
          {tab !== 'reset' && (
            <div className="auth-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === 'signin'} onClick={() => switchTab('signin')}>
                Sign in
              </button>
              <button type="button" role="tab" aria-selected={tab === 'signup'} onClick={() => switchTab('signup')}>
                Create account
              </button>
            </div>
          )}
          <div>
            <h2>{titles[tab]}</h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              {blurbs[tab]}
            </p>
          </div>

          <form className="login-card" onSubmit={submit} noValidate>
            {tab === 'signup' && (
              <label className="field">
                <span>Your name</span>
                <input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ananya Sen" />
              </label>
            )}
            {tab === 'signup' && !demo && (
              <div className="field">
                <span>Company</span>
                <div className="auth-tabs" role="radiogroup" style={{ alignSelf: 'stretch' }}>
                  <button type="button" role="radio" aria-checked={companyMode === 'join'} aria-selected={companyMode === 'join'} onClick={() => setCompanyMode('join')} style={{ flex: 1 }}>
                    Join my company
                  </button>
                  <button type="button" role="radio" aria-checked={companyMode === 'create'} aria-selected={companyMode === 'create'} onClick={() => setCompanyMode('create')} style={{ flex: 1 }}>
                    Create a new company
                  </button>
                </div>
              </div>
            )}
            {tab === 'signup' && !demo && companyMode === 'join' && (
              <label className="field">
                <span>Company code (6 characters, from your Admin)</span>
                <input className="input num" {...noAuto} maxLength={8} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. K7P2QX" style={{ letterSpacing: '.2em' }} />
              </label>
            )}
            {tab === 'signup' && !demo && companyMode === 'create' && (
              <label className="field">
                <span>Company name</span>
                <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Intech Recruitment" />
              </label>
            )}
            <label className="field">
              <span>Email</span>
              <input className="input" type="email" autoComplete="username" {...noAuto} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
            </label>
            {tab !== 'reset' && (
              <label className="field">
                <span>Password{tab === 'signup' ? ' (at least 6 characters)' : ''}</span>
                <input
                  className="input"
                  type="password"
                  autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
                  {...noAuto}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
            {tab !== 'reset' && (
              <label className="check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span>Keep me signed in on this device</span>
              </label>
            )}
            {error && <p className="err">{error}</p>}
            {info && <p className="ok">{info}</p>}
            <button className="btn primary" style={{ justifyContent: 'center' }} disabled={busy}>
              {busy ? 'Please wait…' : tab === 'signup' ? 'Create account' : tab === 'reset' ? 'Send reset link' : 'Sign in'}
            </button>
            {tab === 'signin' && (
              <button type="button" className="linkbtn" style={{ justifySelf: 'start' }} onClick={() => switchTab('reset')}>
                Forgot password?
              </button>
            )}
            {tab === 'reset' && (
              <button type="button" className="linkbtn" style={{ justifySelf: 'start' }} onClick={() => switchTab('signin')}>
                Back to sign in
              </button>
            )}

            {tab === 'signin' && demoMembers.length > 0 && (
              <div className="demo-accts">
                <div className="faint" style={{ fontSize: 12 }}>
                  Demo mode · pick an account (password <span className="num">{DEMO_PASSWORD}</span>)
                </div>
                {demoMembers.map(([id, u]) => (
                  <button type="button" key={id} className="demo-acct" disabled={busy} onClick={() => run(() => backend.signIn(u.email, DEMO_PASSWORD, remember))}>
                    <Avatar id={id} name={u.displayName} />
                    <span style={{ flex: 1 }}>
                      <b>{u.displayName}</b> <span className="faint">· {ROLES[u.role]}</span>
                      <br />
                      <span className="num faint" style={{ fontSize: 12 }}>
                        {u.email}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  )
}
