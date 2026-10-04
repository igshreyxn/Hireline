import { useApp } from '../store.jsx'
import { DEMO_PASSWORD, ROLES, SOURCES, D } from '../constants.js'
import { clone, copyText, fmtDate, fmtDay, lpa, nowIso, uid } from '../utils.js'

const STAGE_FORMS = {
  screened: { t: 'Log screening call', d: 'What did you learn on the call? Interest, CTC, notice, reasons to move.', required: true, btn: 'Mark screened' },
  briefed: { t: 'Log senior HR call', d: 'How did the role briefing go? Anything the client should know?', btn: 'Mark briefed' },
  shortlisted: { t: 'Client shortlisted', d: "Paste or summarise the client's feedback.", required: true, feedback: true, btn: 'Save feedback' },
  rejected: { t: 'Client rejected', d: 'What reason did the client give?', required: true, feedback: true, btn: 'Close as rejected', danger: true },
  dropped: { t: 'Candidate dropped out', d: 'Why did the candidate drop out?', btn: 'Close as dropped', danger: true },
  signed: { t: 'Letter signed', d: 'Joining date or anything else to note.', btn: 'Mark signed' },
  expired: { t: "Didn't sign in 24 hours", d: 'What happened?', btn: 'Close', danger: true },
}

export function profileText(c, r) {
  const lines = [
    `Candidate: ${c.name}`,
    `Role: ${r.title} (${r.client})`,
    `Experience: ${c.exp} years · Currently at ${c.company || '—'}`,
    `Current CTC: ${lpa(c.currentCtc)} · Expected CTC: ${lpa(c.expectedCtc)}`,
    `Notice period: ${c.notice !== '' && c.notice != null ? c.notice + ' days' : '—'}`,
    `Location: ${c.location || '—'}`,
    `Phone: ${c.phone || '—'} · Email: ${c.email || '—'}`,
  ]
  if ((c.notes || []).length) lines.push('', 'Recruiter notes:', ...c.notes.map((n) => '- ' + n.text))
  return lines.join('\n')
}

export function chaseText(c, r, sender) {
  const who = (r.clientContact || '').split(',')[0].trim()
  return `Hi ${who || 'team'},

Following up on ${c.name}'s profile for the ${r.title} role, which we shared on ${fmtDay(c.submittedAt || c.updatedAt)}. Could you let us know your feedback, and whether you'd like to move ahead with a call?

Thanks,
${sender}`
}

function Foot({ label, danger, onCancel }) {
  return (
    <div className="foot">
      <button type="button" className="btn" onClick={onCancel}>
        Cancel
      </button>
      <button className={'btn ' + (danger ? 'danger' : 'primary')}>{label}</button>
    </div>
  )
}

const Field = ({ label, children, style }) => (
  <label className="field" style={style}>
    <span>{label}</span>
    {children}
  </label>
)

export default function Modal({ modal }) {
  const app = useApp()
  const { data, userId, filterReq, reqOf, personName, closeModal, toast } = app
  const c = modal.id ? data.cands[modal.id] : null

  // Read a submitted form into a plain object.
  const read = (e) => Object.fromEntries(new FormData(e.currentTarget).entries())
  const num = (v) => (v === '' || v == null ? '' : +v)

  let content = null

  if (modal.type === 'cand') {
    const x = modal.id
      ? c
      : { reqId: filterReq !== 'all' ? filterReq : Object.keys(data.reqs).find((k) => data.reqs[k].status === 'open') || '', source: 'Naukri' }
    const onSubmit = (e) => {
      e.preventDefault()
      const f = read(e)
      const base = modal.id
        ? clone(c)
        : { stage: 'sourced', owner: userId, history: [{ stage: 'sourced', at: nowIso(), by: userId }], notes: [], feedback: '', createdAt: nowIso() }
      Object.assign(base, {
        name: f.name.trim(), reqId: f.reqId, phone: f.phone.trim(), email: f.email.trim(), source: f.source,
        exp: num(f.exp), company: f.company.trim(), location: f.location.trim(),
        currentCtc: num(f.currentCtc), expectedCtc: num(f.expectedCtc), notice: num(f.notice), updatedAt: nowIso(),
      })
      if (!modal.id && f.note?.trim()) base.notes = [{ text: f.note.trim(), by: userId, at: nowIso() }]
      app.saveCand(modal.id || uid('c_'), base)
      closeModal()
      toast(modal.id ? 'Saved' : `${base.name} added to Sourced`)
    }
    content = (
      <form noValidate className="modal-box" onSubmit={onSubmit}>
        <h2>{modal.id ? 'Edit candidate' : 'Add candidate'}</h2>
        <div className="grid2">
          <Field label="Full name"><input className="input" name="name" required defaultValue={x.name || ''} /></Field>
          <Field label="Client role">
            <select className="input" name="reqId" required defaultValue={x.reqId}>
              {Object.entries(data.reqs).map(([id, r]) => (
                <option key={id} value={id}>{r.client} · {r.title}</option>
              ))}
            </select>
          </Field>
          <Field label="Phone"><input className="input" name="phone" defaultValue={x.phone || ''} placeholder="+91 …" /></Field>
          <Field label="Email"><input className="input" name="email" type="email" defaultValue={x.email || ''} /></Field>
          <Field label="Found on">
            <select className="input" name="source" defaultValue={x.source}>
              {SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Experience (years)"><input className="input num" name="exp" type="number" min="0" step="0.5" defaultValue={x.exp ?? ''} /></Field>
          <Field label="Current company"><input className="input" name="company" defaultValue={x.company || ''} /></Field>
          <Field label="Location"><input className="input" name="location" defaultValue={x.location || ''} /></Field>
          <Field label="Current CTC (LPA)"><input className="input num" name="currentCtc" type="number" min="0" step="0.1" defaultValue={x.currentCtc ?? ''} /></Field>
          <Field label="Expected CTC (LPA)"><input className="input num" name="expectedCtc" type="number" min="0" step="0.1" defaultValue={x.expectedCtc ?? ''} /></Field>
          <Field label="Notice period (days)"><input className="input num" name="notice" type="number" min="0" defaultValue={x.notice ?? ''} /></Field>
        </div>
        {!modal.id && (
          <Field label="First note (optional)"><textarea className="input" name="note" placeholder="Why this profile fits" /></Field>
        )}
        <Foot label={modal.id ? 'Save changes' : 'Add to pipeline'} onCancel={closeModal} />
      </form>
    )
  } else if (modal.type === 'req') {
    const x = modal.id ? data.reqs[modal.id] : { status: 'open', positions: 1 }
    const onSubmit = (e) => {
      e.preventDefault()
      const f = read(e)
      if (+f.ctcMax < +f.ctcMin) {
        toast('Salary "up to" must be at least the "from" amount')
        return
      }
      const base = modal.id ? clone(x) : { createdAt: nowIso(), createdBy: userId }
      Object.assign(base, {
        client: f.client.trim(), title: f.title.trim(), clientContact: f.clientContact.trim(), location: f.location.trim(),
        ctcMin: num(f.ctcMin), ctcMax: num(f.ctcMax), expMin: num(f.expMin), expMax: num(f.expMax),
        positions: num(f.positions) || 1, status: f.status,
        skills: f.skills.split(',').map((s) => s.trim()).filter(Boolean), jd: f.jd.trim(),
      })
      app.saveReq(modal.id || uid('r_'), base)
      closeModal()
      toast('Requirement saved')
    }
    content = (
      <form noValidate className="modal-box" onSubmit={onSubmit}>
        <h2>{modal.id ? 'Edit requirement' : 'New client requirement'}</h2>
        <p className="muted" style={{ margin: 0 }}>Fill this in during or after the call with the client's HR.</p>
        <div className="grid2">
          <Field label="Client company"><input className="input" name="client" required defaultValue={x.client || ''} placeholder="e.g. RSM" /></Field>
          <Field label="Role title"><input className="input" name="title" required defaultValue={x.title || ''} placeholder="e.g. Technical Manager" /></Field>
          <Field label="Client HR contact"><input className="input" name="clientContact" defaultValue={x.clientContact || ''} placeholder="Name, designation" /></Field>
          <Field label="Location / work mode"><input className="input" name="location" defaultValue={x.location || ''} placeholder="Kolkata · hybrid" /></Field>
          <Field label="Salary from (LPA)"><input className="input num" name="ctcMin" type="number" min="0" step="0.5" required defaultValue={x.ctcMin ?? ''} /></Field>
          <Field label="Salary up to (LPA)"><input className="input num" name="ctcMax" type="number" min="0" step="0.5" required defaultValue={x.ctcMax ?? ''} /></Field>
          <Field label="Experience from (yrs)"><input className="input num" name="expMin" type="number" min="0" defaultValue={x.expMin ?? ''} /></Field>
          <Field label="Experience up to (yrs)"><input className="input num" name="expMax" type="number" min="0" defaultValue={x.expMax ?? ''} /></Field>
          <Field label="Positions"><input className="input num" name="positions" type="number" min="1" defaultValue={x.positions ?? 1} /></Field>
          <Field label="Status">
            <select className="input" name="status" defaultValue={x.status}>
              <option value="open">Open</option>
              <option value="hold">On hold</option>
              <option value="closed">Closed</option>
            </select>
          </Field>
        </div>
        <Field label="Must-have skills (comma separated)"><input className="input" name="skills" defaultValue={(x.skills || []).join(', ')} placeholder="Java, AWS, team leadership" /></Field>
        <Field label="What the client is looking for"><textarea className="input" name="jd" defaultValue={x.jd || ''} /></Field>
        <Foot label={modal.id ? 'Save changes' : 'Add requirement'} onCancel={closeModal} />
      </form>
    )
  } else if (modal.type === 'stage') {
    const cfg = STAGE_FORMS[modal.stage]
    const onSubmit = (e) => {
      e.preventDefault()
      const text = read(e).text || ''
      closeModal()
      if (cfg.feedback) app.moveStage(modal.id, modal.stage, { feedback: text.trim() })
      else app.moveStage(modal.id, modal.stage, {}, text)
    }
    content = (
      <form noValidate className="modal-box" onSubmit={onSubmit}>
        <h2>{cfg.t}</h2>
        <div className="faint">{c.name} · {reqOf(c).title}</div>
        <Field label={cfg.d}><textarea className="input" name="text" placeholder="Optional" autoFocus /></Field>
        <Foot label={cfg.btn} danger={cfg.danger} onCancel={closeModal} />
      </form>
    )
  } else if (modal.type === 'submit') {
    const r = reqOf(c)
    const text = profileText(c, r)
    content = (
      <form noValidate className="modal-box" onSubmit={(e) => { e.preventDefault(); closeModal(); app.moveStage(modal.id, 'submitted', { submittedAt: nowIso() }) }}>
        <h2>Send profile to {r.client}</h2>
        <p className="muted" style={{ margin: 0 }}>Copy this into your email to {r.clientContact || 'the client HR'}, attach the CV, then mark it sent.</p>
        <pre className="copybox">{text}</pre>
        <div className="foot">
          <button type="button" className="btn" onClick={closeModal}>Cancel</button>
          <button type="button" className="btn" onClick={() => copyText(text, toast)}>Copy text</button>
          <button className="btn primary">Mark as sent</button>
        </div>
      </form>
    )
  } else if (modal.type === 'copy') {
    const r = reqOf(c)
    const text = modal.copy === 'chase' ? chaseText(c, r, personName(userId)) : profileText(c, r)
    content = (
      <div className="modal-box">
        <h2>{modal.copy === 'chase' ? 'Follow-up to client HR' : 'Profile summary for the client'}</h2>
        <pre className="copybox">{text}</pre>
        <div className="foot">
          <button className="btn" onClick={closeModal}>Close</button>
          <button className="btn primary" onClick={() => copyText(text, toast)}>Copy text</button>
        </div>
      </div>
    )
  } else if (modal.type === 'meet') {
    const d = new Date(c.meetAt || Date.now() + D)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    const onSubmit = (e) => {
      e.preventDefault()
      const f = read(e)
      const when = new Date(f.when).toISOString()
      closeModal()
      if (c.stage === 'interview') {
        const cc = clone(c)
        cc.meetAt = when
        if (f.text.trim()) cc.notes = [...(cc.notes || []), { text: f.text.trim(), by: userId, at: nowIso() }]
        cc.updatedAt = nowIso()
        app.saveCand(modal.id, cc)
        toast('G-Meet rescheduled')
      } else {
        app.moveStage(modal.id, 'interview', { meetAt: when }, f.text)
      }
    }
    content = (
      <form noValidate className="modal-box" onSubmit={onSubmit}>
        <h2>Schedule G-Meet</h2>
        <div className="faint">{c.name} with our HR</div>
        <Field label="Date and time"><input className="input" name="when" type="datetime-local" required defaultValue={d.toISOString().slice(0, 16)} /></Field>
        <Field label="Meet link or note (optional)"><input className="input" name="text" placeholder="meet.google.com/…" /></Field>
        <Foot label="Save" onCancel={closeModal} />
      </form>
    )
  } else if (modal.type === 'offer') {
    content = (
      <form noValidate className="modal-box" onSubmit={(e) => { e.preventDefault(); const t = read(e).text; closeModal(); app.moveStage(modal.id, 'offer', { offerAt: nowIso() }, t) }}>
        <h2>Offer letter sent</h2>
        <p style={{ margin: 0 }}>
          This starts the <b>24-hour</b> signing window for {c.name}. The deadline will be <b className="num">{fmtDate(Date.now() + D)}</b>.
        </p>
        <Field label="Note (optional)"><textarea className="input" name="text" placeholder="Final CTC offered, joining date" /></Field>
        <Foot label="Start 24h clock" onCancel={closeModal} />
      </form>
    )
  } else if (modal.type === 'member') {
    const onSubmit = (e) => {
      e.preventDefault()
      const f = read(e)
      const email = f.email.trim().toLowerCase()
      if (Object.values(data.team).some((m) => (m.email || '').toLowerCase() === email)) {
        toast('Someone already uses that email')
        return
      }
      app.saveMember(uid('u_'), { displayName: f.name.trim(), email, role: f.role, password: f.password, joinedAt: nowIso() })
      closeModal()
      toast(`${f.name.trim()} added`)
    }
    content = (
      <form noValidate className="modal-box" onSubmit={onSubmit}>
        <h2>Add team member</h2>
        <p className="muted" style={{ margin: 0 }}>They sign in with this email and password on this device.</p>
        <div className="grid2">
          <Field label="Name"><input className="input" name="name" required /></Field>
          <Field label="Email"><input className="input" name="email" type="email" required /></Field>
          <Field label="Role">
            <select className="input" name="role" defaultValue="junior">
              {Object.entries(ROLES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field label="Password"><input className="input" name="password" required minLength={6} defaultValue={DEMO_PASSWORD} /></Field>
        </div>
        <Foot label="Add member" onCancel={closeModal} />
      </form>
    )
  } else if (modal.type === 'confirm') {
    const run = () => {
      if (modal.action === 'removeCand') { app.openCandidate(null); app.removeCand(modal.id); toast('Candidate deleted') }
      if (modal.action === 'removeMember') { app.removeMember(modal.id); toast('Member removed') }
      if (modal.action === 'clearExamples') { app.clearExamples(); toast('Example data removed') }
      if (modal.action === 'resetDemo') { app.resetDemo(); toast('Demo data restored') }
    }
    content = (
      <form noValidate className="modal-box" onSubmit={(e) => { e.preventDefault(); closeModal(); run() }}>
        <h2>{modal.title}</h2>
        <p style={{ margin: 0 }}>{modal.text}</p>
        <Foot label={modal.btn} danger onCancel={closeModal} />
      </form>
    )
  }

  return (
    <div
      className="modal"
      onClick={(e) => e.target === e.currentTarget && closeModal()}
      onSubmitCapture={(e) => {
        // Check required fields ourselves: some phones and embedded viewers hide the browser's warning.
        const bad = [...e.target.querySelectorAll('[required]')].find((x) => !String(x.value).trim())
        if (bad) {
          e.preventDefault()
          e.stopPropagation()
          toast((bad.closest('.field')?.querySelector('span')?.textContent || 'This field') + ' is needed')
          bad.focus()
        }
      }}
    >
      {content}
    </div>
  )
}
