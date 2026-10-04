import { useState } from 'react'
import { authMessage } from '../backend/useFirebaseBackend.js'

// For a signed-in account that isn't part of a company yet
// (an older account, or someone an Admin removed).
export default function CompanySetup({ profile, backend }) {
  const [mode, setMode] = useState('join')
  const [company, setCompany] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'create' && !company.trim()) return setError('Enter your company’s name.')
    if (mode === 'join' && code.replace(/[^a-z0-9]/gi, '').length < 6) return setError('Enter the 6-character company code from your Admin.')
    setBusy(true)
    try {
      await backend.setUpCompany(mode === 'create' ? { mode: 'create', company } : { mode: 'join', code })
    } catch (err) {
      setError(authMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <form className="panel" style={{ maxWidth: 480, width: '100%', gap: 14 }} onSubmit={submit} noValidate>
        <div className="label">Signed in as {profile.email}</div>
        <h2 style={{ fontSize: 22 }}>Which company are you with?</h2>
        <p className="muted" style={{ margin: 0 }}>
          Join your team with the code your Admin shared, or start Hireline for a new company. Whoever creates a company
          becomes its Admin.
        </p>
        <div className="auth-tabs" role="radiogroup" style={{ alignSelf: 'stretch' }}>
          <button type="button" role="radio" aria-checked={mode === 'join'} aria-selected={mode === 'join'} onClick={() => setMode('join')} style={{ flex: 1 }}>
            Join my company
          </button>
          <button type="button" role="radio" aria-checked={mode === 'create'} aria-selected={mode === 'create'} onClick={() => setMode('create')} style={{ flex: 1 }}>
            Create a new company
          </button>
        </div>
        {mode === 'join' ? (
          <label className="field">
            <span>Company code</span>
            <input className="input num" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={8} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. K7P2QX" style={{ letterSpacing: '.2em' }} />
          </label>
        ) : (
          <label className="field">
            <span>Company name</span>
            <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Intech Recruitment" />
          </label>
        )}
        {error && <p className="err">{error}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn primary" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'create' ? 'Create company' : 'Join company'}
          </button>
          <button type="button" className="btn" onClick={backend.signOut}>
            Sign out
          </button>
        </div>
      </form>
    </div>
  )
}
