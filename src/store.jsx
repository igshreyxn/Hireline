import { createContext, useContext } from 'react'
import { DEMO_PASSWORD, DEMO_USERS, CLOSED } from './constants.js'
import { makeSample } from './sampleData.js'

const DATA_KEY = 'hireline-data-v1'
const SESSION_KEY = 'hireline-session'

// Fresh desk: sample roles + candidates and the four demo accounts.
export function freshData() {
  const s = makeSample(Date.now())
  return {
    reqs: s.reqs,
    cands: s.cands,
    team: Object.fromEntries(
      DEMO_USERS.map((u) => [u.id, { displayName: u.name, role: u.role, email: u.email, password: DEMO_PASSWORD }]),
    ),
    settings: { name: 'Demo agency' },
  }
}

// Data is saved in this browser (localStorage), so it survives reloads on the same device.
export function loadData() {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* storage blocked: fall back to sample data */
  }
  return freshData()
}

export function saveData(data) {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data))
  } catch {
    /* ignore */
  }
}

export function loadSession() {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export function saveSession(id) {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id)
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

// Permission rules: juniors can only screen or drop early-stage candidates.
export function canMove(role, cand, to) {
  if (role === 'senior' || role === 'admin') return true
  if (cand.stage === 'sourced' && to === 'screened') return true
  if (['sourced', 'screened'].includes(cand.stage) && to === 'dropped') return true
  return false
}

export const isClosed = (stage) => !!CLOSED[stage]
