import { D, H } from './constants.js'

export const nowIso = () => new Date().toISOString()
export const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
export const clone = (o) => JSON.parse(JSON.stringify(o))

export const fmtDate = (t) =>
  new Date(t).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
export const fmtDay = (t) =>
  new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export function ago(t) {
  const m = Math.round((Date.now() - new Date(t)) / 60e3)
  if (m < 1) return 'just now'
  if (m < 60) return m + 'm ago'
  const h = Math.round(m / 60)
  if (h < 24) return h + 'h ago'
  return Math.round(h / 24) + 'd ago'
}

export const daysSince = (t) => (Date.now() - new Date(t)) / D

export function lpa(v) {
  if (v === '' || v == null || isNaN(v)) return '—'
  return '₹' + (+v).toLocaleString('en-IN', { maximumFractionDigits: 1 }) + ' LPA'
}

export function timeLeft(deadline) {
  const ms = new Date(deadline) - Date.now()
  if (ms <= 0) return { txt: 'Deadline passed', ms, pct: 100 }
  const h = Math.floor(ms / H)
  const m = Math.floor((ms % H) / 60e3)
  return { txt: `${h}h ${String(m).padStart(2, '0')}m left`, ms, pct: Math.min(100, 100 - (ms / D) * 100) }
}

export const deadlineOf = (c) => new Date(new Date(c.offerAt).getTime() + D).toISOString()

const COLORS = ['#0D6A5B', '#2B5B9E', '#8A4FA3', '#A5561F', '#3F7D2B', '#9E3A5A', '#4E6470']
export function colorFor(id) {
  let h = 0
  for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return COLORS[h % COLORS.length]
}

export const initials = (n) =>
  String(n || '?')
    .split(/\s+/)
    .map((x) => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export async function copyText(text, toast) {
  try {
    await navigator.clipboard.writeText(text)
    toast('Copied')
  } catch {
    toast('Select the text and press Ctrl+C to copy')
  }
}
