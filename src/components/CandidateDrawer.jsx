import { useState } from 'react'
import { useApp, canMove } from '../store.jsx'
import { STAGES, STAGE_IDX, CLOSED, stageLabel, H } from '../constants.js'
import { ago, clone, daysSince, deadlineOf, fmtDate, fmtDay, lpa, nowIso, timeLeft } from '../utils.js'

export default function CandidateDrawer({ id, onClose }) {
  const app = useApp()
  const { data, role, isSenior, isAdmin, userId, personName, reqOf, overBudget, openModal, saveCand, moveStage, toast } = app
  const c = data.cands[id]
  const r = reqOf(c)
  const [note, setNote] = useState('')
  const [manual, setManual] = useState(c.stage)

  const closed = !!CLOSED[c.stage]
  const lastActive = closed ? [...(c.history || [])].reverse().find((h) => STAGE_IDX[h.stage] != null)?.stage : c.stage
  const li = STAGE_IDX[lastActive] ?? 0

  const addNote = (e) => {
    e.preventDefault()
    if (!note.trim()) return
    const cc = clone(c)
    cc.notes = [...(cc.notes || []), { text: note.trim(), by: userId, at: nowIso() }]
    cc.updatedAt = nowIso()
    saveCand(id, cc)
    setNote('')
    toast('Note added')
  }

  const moveManual = () => {
    if (manual === c.stage) return
    const extra = manual === 'offer' ? { offerAt: nowIso() } : manual === 'submitted' ? { submittedAt: nowIso() } : {}
    moveStage(id, manual, extra, 'Moved manually')
  }

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={c.name}>
        <div className="drawer-h">
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="label">
              {r.client} · {r.title}
            </div>
            <h2>{c.name}</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              <span className={'pill ' + (closed ? '' : 'accent')}>{stageLabel(c.stage)}</span>
              {overBudget(c) && (
                <span className="pill amber">
                  Expects {lpa(c.expectedCtc)} · band tops at ₹{r.ctcMax} LPA
                </span>
              )}
            </div>
          </div>
          <button className="btn sm ghost" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="drawer-b">
          <div className={'stepper ' + (closed ? 'closed' : '')} title={stageLabel(c.stage)}>
            {STAGES.map((s, i) => (
              <div key={s.k} className={i < li ? 'done' : i === li ? 'cur' : ''} title={s.label} />
            ))}
          </div>

          <ActionPanel id={id} c={c} r={r} role={role} isSenior={isSenior} openModal={openModal} />

          {c.feedback && (
            <div className="sec">
              <h3>Client feedback</h3>
              <div className="feedback">{c.feedback}</div>
            </div>
          )}

          <div className="sec">
            <h3>Candidate</h3>
            <div className="kv">
              <KV label="Phone" value={c.phone || '—'} mono />
              <KV label="Email" value={c.email || '—'} />
              <KV label="Experience" value={`${c.exp} yrs`} mono />
              <KV label="Current company" value={c.company || '—'} />
              <KV label="Current CTC" value={lpa(c.currentCtc)} mono />
              <KV label="Expected CTC" value={lpa(c.expectedCtc)} mono />
              <KV label="Notice period" value={c.notice !== '' && c.notice != null ? `${c.notice} days` : '—'} mono />
              <KV label="Location" value={c.location || '—'} />
              <KV label="Source" value={c.source || '—'} />
              <KV label="Sourced by" value={personName(c.owner)} />
            </div>
            <div className="toolbar">
              <button className="btn sm" onClick={() => openModal({ type: 'copy', copy: 'profile', id })}>
                Copy profile for client
              </button>
              {(isSenior || c.owner === userId) && (
                <button className="btn sm" onClick={() => openModal({ type: 'cand', id })}>
                  Edit details
                </button>
              )}
            </div>
          </div>

          <div className="sec">
            <h3>Notes</h3>
            <div className="notes">
              {(c.notes || []).length ? (
                c.notes.map((n, i) => (
                  <div className="note" key={i}>
                    <p>{n.text}</p>
                    <small>
                      {personName(n.by)} · {fmtDate(n.at)}
                    </small>
                  </div>
                ))
              ) : (
                <div className="faint" style={{ fontSize: 13 }}>
                  No notes yet.
                </div>
              )}
            </div>
            <form className="sec" onSubmit={addNote}>
              <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Call summary, availability, salary talk…" />
              <div>
                <button className="btn sm">Add note</button>
              </div>
            </form>
          </div>

          <div className="sec">
            <h3>History</h3>
            <ol className="timeline">
              {[...(c.history || [])].reverse().map((h, i) => (
                <li key={i}>
                  <b style={{ fontWeight: 500 }}>{stageLabel(h.stage)}</b>
                  <small>
                    {personName(h.by)} · {fmtDate(h.at)}
                  </small>
                </li>
              ))}
            </ol>
          </div>

          {isSenior && (
            <div className="sec">
              <h3>Move manually</h3>
              <div className="toolbar">
                <select className="input" style={{ width: 'auto' }} value={manual} onChange={(e) => setManual(e.target.value)}>
                  {[...STAGES.map((s) => [s.k, s.label]), ...Object.entries(CLOSED)].map(([k, l]) => (
                    <option key={k} value={k}>
                      {l}
                    </option>
                  ))}
                </select>
                <button className="btn sm" onClick={moveManual}>
                  Move
                </button>
                {isAdmin && (
                  <button
                    className="btn sm danger"
                    onClick={() =>
                      openModal({ type: 'confirm', action: 'removeCand', id, title: 'Delete candidate?', text: `${c.name} and their notes will be removed.`, btn: 'Delete' })
                    }
                  >
                    Delete candidate
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

function KV({ label, value, mono }) {
  return (
    <div>
      <span className="label">{label}</span>
      <b className={mono ? 'num' : ''}>{value}</b>
    </div>
  )
}

function ActionPanel({ id, c, r, role, isSenior, openModal }) {
  const Btn = ({ to, label, kind = '' }) => {
    const types = { submitted: 'submit', interview: 'meet', offer: 'offer' }
    return (
      <button className={'btn ' + kind} onClick={() => openModal(types[to] ? { type: types[to], id } : { type: 'stage', id, stage: to })}>
        {label}
      </button>
    )
  }
  const Drop = () => (canMove(role, c, 'dropped') ? <Btn to="dropped" label="Candidate dropped out" kind="ghost" /> : null)
  const Wait = ({ children }) => (
    <p className="muted" style={{ margin: 0 }}>
      {children}
    </p>
  )
  const sent = c.submittedAt || c.updatedAt

  let title = ''
  let body = null
  switch (c.stage) {
    case 'sourced':
      title = 'Next: screening call'
      body = canMove(role, c, 'screened') ? (
        <>
          <Wait>Call the candidate, check interest, CTC and notice period, then log the screening.</Wait>
          <div className="btns">
            <Btn to="screened" label="Log screening call" kind="primary" />
            <Drop />
          </div>
        </>
      ) : (
        <Wait>Waiting for a junior HR to screen.</Wait>
      )
      break
    case 'screened':
      title = 'Next: senior HR call'
      body = isSenior ? (
        <>
          <Wait>
            Brief the candidate on the {r.title} role at {r.client}: responsibilities, salary band ₹{r.ctcMin}–{r.ctcMax} LPA, location.
          </Wait>
          <div className="btns">
            <Btn to="briefed" label="Log senior HR call" kind="primary" />
            <Drop />
          </div>
        </>
      ) : (
        <>
          <Wait>Screened. A senior HR will call and brief the candidate on the role.</Wait>
          <div className="btns">
            <Drop />
          </div>
        </>
      )
      break
    case 'briefed':
      title = 'Next: send profile to client'
      body = isSenior ? (
        <>
          <Wait>Share the profile with {r.clientContact || `${r.client} HR`}. The desk starts counting days for feedback.</Wait>
          <div className="btns">
            <Btn to="submitted" label="Send to client" kind="primary" />
            <Drop />
          </div>
        </>
      ) : (
        <Wait>Briefed. Senior HR will send the profile to the client.</Wait>
      )
      break
    case 'submitted': {
      const d = daysSince(sent)
      title = 'Waiting on client feedback'
      body = (
        <>
          <p style={{ margin: 0 }}>
            Sent to {r.client} <b>{ago(sent)}</b>
            {d >= 2 && <span style={{ color: 'var(--red)' }}> · time to follow up</span>}.
          </p>
          <div className="btns">
            {isSenior && <Btn to="shortlisted" label="Client shortlisted" kind="primary" />}
            {isSenior && <Btn to="rejected" label="Client rejected" />}
            <button className="btn ghost" onClick={() => openModal({ type: 'copy', copy: 'chase', id })}>
              Copy follow-up message
            </button>
          </div>
        </>
      )
      break
    }
    case 'shortlisted':
      title = 'Next: schedule the G-Meet'
      body = isSenior ? (
        <>
          <Wait>Set up the final call between the candidate and our HR.</Wait>
          <div className="btns">
            <Btn to="interview" label="Schedule G-Meet" kind="primary" />
            <Drop />
          </div>
        </>
      ) : (
        <Wait>Client shortlisted. Senior HR will schedule the G-Meet.</Wait>
      )
      break
    case 'interview':
      title = 'G-Meet round'
      body = (
        <>
          <p style={{ margin: 0 }}>
            {c.meetAt ? (
              <>
                Scheduled for <b>{fmtDate(c.meetAt)}</b>.
              </>
            ) : (
              'No time set yet.'
            )}
          </p>
          {isSenior && (
            <div className="btns">
              <Btn to="offer" label="Offer letter sent" kind="primary" />
              <Btn to="interview" label="Reschedule" />
              <Drop />
            </div>
          )}
        </>
      )
      break
    case 'offer': {
      const l = timeLeft(deadlineOf(c))
      title = '24 hours to sign'
      body = (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="num" style={{ fontSize: 22, fontWeight: 500, color: l.ms < 6 * H ? 'var(--red)' : undefined }}>
              {l.txt}
            </span>
            <span className="faint">Deadline {fmtDate(deadlineOf(c))}</span>
          </div>
          {isSenior && (
            <div className="btns">
              <Btn to="signed" label="Letter signed" kind="primary" />
              <Btn to="expired" label="Didn't sign" />
            </div>
          )}
        </>
      )
      break
    }
    case 'signed':
      title = 'Placed'
      body = <p style={{ margin: 0 }}>Offer letter signed {fmtDay(c.updatedAt)}. Nice work.</p>
      break
    default:
      title = CLOSED[c.stage]
      body = (
        <Wait>
          Closed {ago(c.updatedAt)}.{isSenior && ' Use "Move manually" below to reopen.'}
        </Wait>
      )
  }

  return (
    <section className="action">
      <h3>{title}</h3>
      {body}
    </section>
  )
}
