import { useApp } from '../store.jsx'
import { STAGE_IDX, H } from '../constants.js'
import { ago, daysSince, deadlineOf, fmtDate, timeLeft } from '../utils.js'
import Avatar from './Avatar.jsx'

function Row({ id, c, children }) {
  const { reqOf, openCandidate } = useApp()
  const r = reqOf(c)
  return (
    <button className="row" onClick={() => openCandidate(id)}>
      <Avatar id={c.owner} />
      <span className="main">
        <span className="nm">{c.name}</span>
        <span className="sub">
          {r.title} · {r.client}
        </span>
      </span>
      {children}
    </button>
  )
}

function Lane({ title, desc, items, render, action }) {
  return (
    <section className="lane">
      <div className="lane-h">
        <div>
          <h3>
            {title} <span className="faint num">{items.length}</span>
          </h3>
          <p>{desc}</p>
        </div>
        {action}
      </div>
      <div className="rows">
        {items.length ? items.map(render) : <div className="empty">Nothing here right now.</div>}
      </div>
    </section>
  )
}

export default function Today() {
  const { data, me, isSenior, openModal, setView, toast } = useApp()
  const cands = Object.entries(data.cands)
  const reqs = Object.values(data.reqs)
  const by = (k) => cands.filter(([, c]) => c.stage === k)
  const sentAt = (c) => c.submittedAt || c.updatedAt

  const active = cands.filter(([, c]) => STAGE_IDX[c.stage] != null && c.stage !== 'signed').length
  const signed30 = cands.filter(([, c]) => c.stage === 'signed' && daysSince(c.updatedAt) <= 30).length
  const offers = by('offer').sort((a, b) => new Date(a[1].offerAt) - new Date(b[1].offerAt))
  const waiting = by('submitted').sort((a, b) => new Date(sentAt(a[1])) - new Date(sentAt(b[1])))
  const toBrief = by('screened')
  const toSend = by('briefed')
  const toScreen = by('sourced')
  const meets = [...by('interview'), ...by('shortlisted')]

  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const addCandidate = () => {
    if (!Object.keys(data.reqs).length) {
      toast('Add a client role first')
      setView('roles')
      return
    }
    openModal({ type: 'cand' })
  }

  const lanes = {
    offers: (
      <Lane
        key="offers"
        title="Offers ticking"
        desc="Candidates have 24 hours to sign the letter"
        items={offers}
        render={([id, c]) => {
          const l = timeLeft(deadlineOf(c))
          const urgent = l.ms < 6 * H
          return (
            <Row key={id} id={id} c={c}>
              <span className="clock">
                <span className={'num ' + (urgent ? '' : 'muted')} style={{ fontSize: 12, color: urgent ? 'var(--red)' : undefined }}>
                  {l.txt}
                </span>
                <span className={'bar ' + (urgent ? 'red' : '')}>
                  <i style={{ width: l.pct + '%' }} />
                </span>
              </span>
            </Row>
          )
        }}
      />
    ),
    waiting: (
      <Lane
        key="waiting"
        title="Waiting on client feedback"
        desc="Chase after 2 days with a follow-up"
        items={waiting}
        render={([id, c]) => {
          const d = daysSince(sentAt(c))
          return (
            <Row key={id} id={id} c={c}>
              {d >= 2 ? <span className="pill red">{Math.floor(d)}d · chase</span> : <span className="pill">{ago(sentAt(c))}</span>}
            </Row>
          )
        }}
      />
    ),
    brief: (
      <Lane
        key="brief"
        title="Ready for senior HR call"
        desc="Screened by juniors, waiting to be briefed on the role"
        items={toBrief}
        render={([id, c]) => (
          <Row key={id} id={id} c={c}>
            <span className="pill amber">{ago(c.updatedAt)}</span>
          </Row>
        )}
      />
    ),
    send: (
      <Lane
        key="send"
        title="Ready to send to client"
        desc="Briefed by senior HR, profile not shared yet"
        items={toSend}
        render={([id, c]) => (
          <Row key={id} id={id} c={c}>
            <span className="pill accent">{ago(c.updatedAt)}</span>
          </Row>
        )}
      />
    ),
    meets: (
      <Lane
        key="meets"
        title="Client shortlisted & G-Meet"
        desc="Schedule the final call, then send the offer"
        items={meets}
        render={([id, c]) => (
          <Row key={id} id={id} c={c}>
            {c.stage === 'interview' && c.meetAt ? (
              <span className="pill blue">{fmtDate(c.meetAt)}</span>
            ) : (
              <span className="pill accent">Schedule call</span>
            )}
          </Row>
        )}
      />
    ),
    screen: (
      <Lane
        key="screen"
        title="New from job portals"
        desc="Sourced candidates waiting for a screening call"
        items={toScreen}
        action={
          <button className="btn sm" onClick={addCandidate}>
            Add candidate
          </button>
        }
        render={([id, c]) => (
          <Row key={id} id={id} c={c}>
            <span className="pill">{c.source}</span>
          </Row>
        )}
      />
    ),
  }
  const order = isSenior ? ['offers', 'waiting', 'brief', 'send', 'meets', 'screen'] : ['screen', 'brief', 'send', 'waiting', 'offers', 'meets']

  return (
    <>
      <div className="pagehead">
        <div>
          <div className="label">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <h1>
            {greet}, {me.displayName.split(' ')[0]}
          </h1>
        </div>
      </div>

      <div className="stats">
        <Stat label="Open client roles" value={reqs.filter((r) => r.status === 'open').length}
          sub={`${reqs.reduce((a, r) => a + (r.status === 'open' ? +r.positions || 0 : 0), 0)} positions to fill`} />
        <Stat label="In pipeline" value={active} sub={`${toScreen.length} to screen · ${toBrief.length} to brief · ${toSend.length} to send`} />
        <Stat label="With clients" value={waiting.length}
          sub={`${waiting.filter(([, c]) => daysSince(sentAt(c)) >= 2).length} need a follow-up`} />
        <Stat label="Signed · 30 days" value={signed30} sub={`${offers.length} offer${offers.length === 1 ? '' : 's'} pending`} />
      </div>

      <div className="lanes">{order.map((k) => lanes[k])}</div>
    </>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="v num">{value}</div>
      <div className="s">{sub}</div>
    </div>
  )
}
