import { useApp } from '../store.jsx'
import { colorFor, initials } from '../utils.js'

export default function Avatar({ id, name, size }) {
  const app = useApp()
  const n = name || app?.personName(id) || '?'
  const style = { background: colorFor(id) }
  if (size) Object.assign(style, { width: size, height: size, fontSize: size * 0.36 })
  return (
    <span className="av" style={style} title={n}>
      {initials(n)}
    </span>
  )
}
