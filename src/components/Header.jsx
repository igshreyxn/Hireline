import { useApp } from '../store.jsx'
import { ROLES } from '../constants.js'
import Avatar from './Avatar.jsx'

const NAV = [
  ['today', 'Today'],
  ['pipeline', 'Pipeline'],
  ['roles', 'Client roles'],
  ['team', 'Team'],
]

export default function Header({ view, onNav, onLogout }) {
  const { data, me, userId, role } = useApp()
  return (
    <header className="top">
      <div className="top-in">
        <div className="brand">
          <b>Hireline</b>
          <span>{data.settings?.name || 'Recruitment desk'}</span>
        </div>
        <nav className="nav">
          {NAV.map(([k, l]) => (
            <button key={k} aria-current={view === k ? 'page' : undefined} onClick={() => onNav(k)}>
              {l}
            </button>
          ))}
        </nav>
        <div className="who">
          <Avatar id={userId} />
          <span>
            <b style={{ fontWeight: 600 }}>{me.displayName}</b> <span className="role">· {ROLES[role]}</span>
          </span>
          <button className="btn sm ghost" onClick={onLogout}>
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
