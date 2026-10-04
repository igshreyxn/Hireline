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
    if (mode === 'create' && !company.trim()) return setError('Enter your team or company name.')
    if (mode === 'join' && code.replace(/[^a-z0-9]/gi, '').length < 6) return setError('Enter the 6-character team code from your Admin.')
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
        <div className="label">Welcome{profile.displayName ? `, ${profile.displayName}` : ''} · {profile.email}</div>
        <h2 style={{ fontSize: 22 }}>Set up your team</h2>
        <p className="muted" style={{ margin: 0 }}>
          Create a team for your company and you become its Admin: you invite people and choose their roles. Or join an
          existing team with the team code your Admin shared.
        </p>
        <div className="auth-tabs" role="radiogroup" style={{ alignSelf: 'stretch' }}>
          <button type="button" role="radio" aria-checked={mode === 'join'} aria-selected={mode === 'join'} onClick={() => setMode('join')} style={{ flex: 1 }}>
            Join a team
          </button>
          <button type="button" role="radio" aria-checked={mode === 'create'} aria-selected={mode === 'create'} onClick={() => setMode('create')} style={{ flex: 1 }}>
            Create a team
          </button>
        </div>
        {mode === 'join' ? (
          <label className="field">
            <span>Team code (6 characters, from your Admin)</span>
            <input className="input num" autoCapitalize="none" autoCorrect="off" spellCheck={false} maxLength={8} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. K7P2QX" style={{ letterSpacing: '.2em' }} />
          </label>
        ) : (
          <label className="field">
            <span>Team / company name</span>
            <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Intech Recruitment" />
          </label>
        )}
        {error && <p className="err">{error}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn primary" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'create' ? 'Create team' : 'Join team'}
          </button>
          <button type="button" className="btn" onClick={backend.signOut}>
            Sign out
          </button>
        </div>
      </form>
    </div>
  )
}
