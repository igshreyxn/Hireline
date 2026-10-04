import { useState } from 'react'
import { copyText } from '../utils.js'
import { useApp } from '../store.jsx'
import { ROLES } from '../constants.js'
import { ago, daysSince } from '../utils.js'
import Avatar from './Avatar.jsx'

export default function Team() {
  const { data, userId, isAdmin, mode, saveMember, saveSettings, seedExamples, openModal, toast } = useApp()
  const [wsName, setWsName] = useState(data.settings?.name || '')
  const all = Object.entries(data.team).sort((a, b) => (a[1].displayName || '').localeCompare(b[1].displayName || ''))
  const pending = all.filter(([, m]) => m.role === 'pending')
  const members = all.filter(([, m]) => m.role !== 'pending')
  const cands = Object.values(data.cands)
  const hasExamples = Object.values(data.reqs).some((r) => r.example) || cands.some((c) => c.example)

  const statsFor = (id) => ({
    owned: cands.filter((c) => c.owner === id).length,
    moved: cands.reduce((a, c) => a + (c.history || []).filter((h) => h.by === id && daysSince(h.at) <= 7).length, 0),
  })

  const joinCode = data.org?.joinCode
  const appLink = typeof window !== 'undefined' ? window.location.origin : ''
  const invite = joinCode
    ? `Join ${data.settings?.name || 'our team'} on Hireline:\n1. Open ${appLink}\n2. Tap "Create account", then "Join my company"\n3. Enter the company code: ${joinCode}\nI'll approve you once you've signed up.`
    : ''

  const approve = (id, m, role) => {
    saveMember(id, { ...m, role, approvedAt: new Date().toISOString(), approvedBy: userId })
    toast(`${m.displayName} approved as ${ROLES[role]}`)
  }

  return (
    <>
      <div className="pagehead">
        <div>
          <div className="label">People and settings</div>
          <h1>Team</h1>
        </div>
      </div>

      {isAdmin && joinCode && (
        <section className="panel">
          <h3 style={{ fontSize: 16 }}>Invite your team</h3>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div className="label">Company code</div>
              <div className="num" style={{ fontSize: 28, fontWeight: 500, letterSpacing: '.18em' }}>
                {joinCode}
              </div>
            </div>
            <p className="muted" style={{ margin: 0, flex: 1, minWidth: 220, fontSize: 13 }}>
              Teammates open {appLink.replace(/^https?:\/\//, '')}, choose <b>Create account → Join my company</b> and
              enter this code. They show up below for you to approve. Only people you approve can see your company's data.
            </p>
            <button className="btn" onClick={() => copyText(invite, toast)}>
              Copy invite message
            </button>
          </div>
        </section>
      )}

      {isAdmin && pending.length > 0 && (
        <section className="panel" style={{ borderColor: 'var(--amber)' }}>
          <h3 style={{ fontSize: 16 }}>
            Waiting for approval <span className="faint num">{pending.length}</span>
          </h3>
          <div className="members">
            {pending.map(([id, m]) => (
              <div className="member" key={id}>
                <Avatar id={id} name={m.displayName} />
                <div className="main">
                  <b>{m.displayName}</b>
                  <div className="faint" style={{ fontSize: 12 }}>
                    {m.email} · signed up {m.createdAt ? ago(m.createdAt) : ''}
                  </div>
                </div>
                <button className="btn sm primary" onClick={() => approve(id, m, 'junior')}>
                  Approve as Junior HR
                </button>
                <button className="btn sm" onClick={() => approve(id, m, 'senior')}>
                  Approve as Senior HR
                </button>
                <button
                  className="btn sm danger"
                  onClick={() =>
                    openModal({ type: 'confirm', action: 'removeMember', id, title: 'Decline this sign-up?', text: `${m.displayName} won't get access. If they sign in again, they'll show up here again.`, btn: 'Decline' })
                  }
                >
                  Decline
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <h3 style={{ fontSize: 16 }}>Members</h3>
        <div className="members">
          {members.map(([id, m]) => {
            const s = statsFor(id)
            return (
              <div className="member" key={id}>
                <Avatar id={id} />
                <div className="main">
                  <b>{m.displayName}</b>
                  {id === userId && <span className="faint"> (you)</span>}
                  <div className="faint" style={{ fontSize: 12 }}>
                    {m.email} · {s.owned} candidates sourced · {s.moved} updates this week
                  </div>
                </div>
                {isAdmin && id !== userId ? (
                  <select
                    className="input"
                    style={{ width: 'auto' }}
                    value={m.role}
                    onChange={(e) => {
                      saveMember(id, { ...m, role: e.target.value })
                      toast(`${m.displayName} is now ${ROLES[e.target.value]}`)
                    }}
                  >
                    {Object.entries(ROLES).map(([k, l]) => (
                      <option key={k} value={k}>
                        {l}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={'pill ' + (m.role === 'admin' ? 'accent' : m.role === 'senior' ? 'blue' : '')}>{ROLES[m.role]}</span>
                )}
                {isAdmin && id !== userId && (
                  <button
                    className="btn sm danger"
                    onClick={() =>
                      openModal({ type: 'confirm', action: 'removeMember', id, title: 'Remove member?', text: `${m.displayName} loses access straight away. Their candidates stay in the pipeline. If they sign in again, they'll need approval again.`, btn: 'Remove' })
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <p className="faint" style={{ margin: 0, fontSize: 13 }}>
          To add someone, send them the invite message with your company code. They choose <b>Create account → Join my
          company</b>, then you approve them here and pick their role. Junior HRs add and screen candidates; Senior HRs and Admins move candidates through every stage and
          manage client roles.
        </p>
      </section>

      {isAdmin && (
        <section className="panel">
          <h3 style={{ fontSize: 16 }}>Workspace</h3>
          <form
            className="toolbar"
            onSubmit={(e) => {
              e.preventDefault()
              saveSettings({ ...data.settings, name: wsName.trim() })
              toast('Workspace name saved')
            }}
          >
            <label className="field" style={{ flex: 1, minWidth: 200 }}>
              <span>Company name shown in the header</span>
              <input className="input" value={wsName} onChange={(e) => setWsName(e.target.value)} placeholder="e.g. your recruiting firm" />
            </label>
            <button className="btn" style={{ alignSelf: 'flex-end' }}>
              Save
            </button>
          </form>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid var(--line)', paddingTop: 12 }}>
            <p className="muted" style={{ margin: 0, flex: 1, minWidth: 200, fontSize: 13 }}>
              {hasExamples
                ? 'Example roles and candidates are loaded. Remove them once you start adding real ones.'
                : 'Want to look around first? Load a few example roles and candidates. You can remove them in one click.'}
            </p>
            {hasExamples ? (
              <button
                className="btn danger"
                onClick={() => openModal({ type: 'confirm', action: 'clearExamples', title: 'Remove example data?', text: 'All example roles and candidates will be deleted for everyone.', btn: 'Remove examples' })}
              >
                Remove example data
              </button>
            ) : (
              <button
                className="btn"
                onClick={() => {
                  seedExamples()
                  toast('Example data loaded')
                }}
              >
                Load example data
              </button>
            )}
            {mode === 'local' && (
              <button className="btn danger" onClick={() => openModal({ type: 'confirm', action: 'resetDemo', title: 'Reset everything?', text: 'All roles, candidates and members are replaced with the demo data.', btn: 'Reset' })}>
                Reset demo
              </button>
            )}
          </div>
        </section>
      )}
    </>
  )
}
