import { useApp } from '../store.jsx'
import { STAGES } from '../constants.js'

function StatusPill({ status }) {
  if (status === 'open') return <span className="pill green">Open</span>
  if (status === 'hold') return <span className="pill amber">On hold</span>
  return <span className="pill">Closed</span>
}

export default function Roles() {
  const { data, isSenior, openModal, setFilterReq, setView } = useApp()
  const reqs = Object.entries(data.reqs).sort(
    (a, b) => (a[1].status === 'closed') - (b[1].status === 'closed') || new Date(b[1].createdAt) - new Date(a[1].createdAt),
  )

  return (
    <>
      <div className="pagehead">
        <div>
          <div className="label">What clients asked us to fill</div>
          <h1>Client roles</h1>
        </div>
        {isSenior && (
          <button className="btn primary" onClick={() => openModal({ type: 'req' })}>
            New requirement
          </button>
        )}
      </div>

      {reqs.length === 0 ? (
        <div className="panel">
          <p className="muted" style={{ margin: 0 }}>
            No client roles yet. When a client's HR shares a requirement, add it here with the salary band and skills so
            juniors know what to source.
          </p>
        </div>
      ) : (
        <div className="roles">
          {reqs.map(([id, r]) => {
            const cs = Object.values(data.cands).filter((c) => c.reqId === id)
            return (
              <article className="rcard" key={id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                  <div>
                    <div className="client">{r.client}</div>
                    <h3>{r.title}</h3>
                    <div className="faint">{r.location}</div>
                  </div>
                  <StatusPill status={r.status} />
                </div>

                <div className="facts">
                  <div>
                    <span className="label">Salary band</span>
                    <b>
                      ₹{r.ctcMin}–{r.ctcMax} LPA
                    </b>
                  </div>
                  <div>
                    <span className="label">Experience</span>
                    <b>
                      {r.expMin}–{r.expMax} yrs
                    </b>
                  </div>
                  <div>
                    <span className="label">Positions</span>
                    <b>{r.positions}</b>
                  </div>
                </div>

                {r.skills?.length > 0 && (
                  <div className="chips">
                    {r.skills.map((s) => (
                      <span className="pill" key={s}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {r.jd && (
                  <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                    {r.jd}
                  </p>
                )}

                <div>
                  <div className="label" style={{ marginBottom: 4 }}>
                    Candidates by stage
                  </div>
                  <div className="funnel">
                    {STAGES.map((s) => {
                      const n = cs.filter((c) => c.stage === s.k).length
                      return (
                        <div key={s.k} title={s.label}>
                          <i className={n ? 'on' : ''}>
                            <b>{n || ''}</b>
                          </i>
                          {s.label.split(' ')[0].slice(0, 6)}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {r.clientContact && (
                  <div style={{ fontSize: 13 }}>
                    <span className="faint">Client HR:</span> {r.clientContact}
                  </div>
                )}

                <div className="acts">
                  <button
                    className="btn sm"
                    onClick={() => {
                      setFilterReq(id)
                      setView('pipeline')
                      window.scrollTo(0, 0)
                    }}
                  >
                    View pipeline
                  </button>
                  {isSenior && (
                    <button className="btn sm" onClick={() => openModal({ type: 'req', id })}>
                      Edit
                    </button>
                  )}
                  {r.example && (
                    <span className="pill" style={{ alignSelf: 'center' }}>
                      Example
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
