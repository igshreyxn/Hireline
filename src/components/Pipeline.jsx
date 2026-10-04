import { useState } from 'react'
import { useApp } from '../store.jsx'
import { STAGES, CLOSED, H } from '../constants.js'
import { ago, daysSince, deadlineOf, fmtDate, lpa, timeLeft } from '../utils.js'
import Avatar from './Avatar.jsx'

export default function Pipeline() {
  const { data, filterReq, setFilterReq, openModal, setView, toast } = useApp()
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()

  const list = Object.entries(data.cands).filter(
    ([, c]) =>
      (filterReq === 'all' || c.reqId === filterReq) &&
      (!query || [c.name, c.company, c.phone, c.email, c.location].join(' ').toLowerCase().includes(query)),
  )
  const cols = [
    ...STAGES.map((s) => ({ ...s, items: list.filter(([, c]) => c.stage === s.k) })),
    { k: 'closed', label: 'Closed', hint: 'Rejected, dropped or expired', items: list.filter(([, c]) => CLOSED[c.stage]) },
  ]

  const addCandidate = () => {
    if (!Object.keys(data.reqs).length) {
      toast('Add a client role first')
      setView('roles')
      return
    }
    openModal({ type: 'cand' })
  }

  return (
    <>
      <div className="pagehead">
        <div>
          <div className="label">Candidates by stage</div>
          <h1>Pipeline</h1>
        </div>
        <div className="toolbar">
          <select className="input" style={{ width: 'auto', maxWidth: '100%' }} value={filterReq} onChange={(e) => setFilterReq(e.target.value)}>
            <option value="all">All client roles</option>
            {Object.entries(data.reqs).map(([id, r]) => (
              <option key={id} value={id}>
                {r.client} · {r.title}
              </option>
            ))}
          </select>
          <input className="input" placeholder="Search name, company, phone" value={q} onChange={(e) => setQ(e.target.value)} style={{ width: 220, maxWidth: '100%' }} />
          <button className="btn primary" onClick={addCandidate}>
            Add candidate
          </button>
        </div>
      </div>

      <div className="board-scroll">
        <div className="board">
          {cols.map((col) => (
            <section className="col" key={col.k}>
              <div className="col-h">
                <div className="t">
                  <span>{col.label}</span>
                  <span className="num faint">{col.items.length}</span>
                </div>
                <div className="h">{col.hint}</div>
              </div>
              <div className="col-b">
                {col.items.length ? (
                  col.items
                    .sort((a, b) => new Date(b[1].updatedAt) - new Date(a[1].updatedAt))
                    .map(([id, c]) => <Card key={id} id={id} c={c} />)
                ) : (
                  <div className="faint" style={{ fontSize: 12, padding: 4 }}>
                    No candidates
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  )
}

function Card({ id, c }) {
  const { reqOf, overBudget, openCandidate } = useApp()
  const r = reqOf(c)
  const chips = []
  if (c.stage === 'offer') {
    const l = timeLeft(deadlineOf(c))
    chips.push(<span key="o" className={'pill ' + (l.ms < 6 * H ? 'red' : 'amber')}>{l.txt}</span>)
  }
  if (c.stage === 'submitted') {
    const sent = c.submittedAt || c.updatedAt
    const d = daysSince(sent)
    chips.push(
      d >= 2 ? <span key="s" className="pill red">Chase · {Math.floor(d)}d</span> : <span key="s" className="pill">Sent {ago(sent)}</span>,
    )
  }
  if (c.stage === 'interview' && c.meetAt) chips.push(<span key="m" className="pill blue">G-Meet {fmtDate(c.meetAt)}</span>)
  if (CLOSED[c.stage]) chips.push(<span key="c" className="pill">{CLOSED[c.stage]}</span>)
  if (overBudget(c) && !CLOSED[c.stage] && c.stage !== 'signed') chips.push(<span key="b" className="pill amber">Above budget</span>)

  return (
    <button className="card" onClick={() => openCandidate(id)}>
      <span className="nm">{c.name}</span>
      <span className="sub">
        {r.title} · {r.client}
      </span>
      <span className="meta">
        <span className="num" style={{ fontSize: 12 }}>
          {c.exp} yrs · {lpa(c.expectedCtc)}
        </span>
      </span>
      {chips.length > 0 && <span className="meta">{chips}</span>}
      <span className="foot">
        <span>{c.company}</span>
        <Avatar id={c.owner} />
      </span>
    </button>
  )
}
