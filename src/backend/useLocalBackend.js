import { useCallback, useEffect, useState } from 'react'
import { DEMO_PASSWORD } from '../constants.js'
import { freshData, loadData, saveData } from '../store.jsx'
import { makeSample } from '../sampleData.js'
import { nowIso, uid } from '../utils.js'

// Demo mode: used until a Firebase config is pasted into src/firebaseConfig.js.
// Everything is stored in this browser only.

const SESSION_KEY = 'hireline-session'

function readSession() {
  try {
    return localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}
function writeSession(id, remember) {
  try {
    localStorage.removeItem(SESSION_KEY)
    sessionStorage.removeItem(SESSION_KEY)
    if (id) (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, id)
  } catch {
    /* storage blocked: session lasts until reload */
  }
}

const fail = (code, message) => Object.assign(new Error(message), { code })

export function useLocalBackend() {
  const [data, setData] = useState(loadData)
  const [userId, setUserId] = useState(readSession)

  useEffect(() => saveData(data), [data])

  const put = useCallback((col, id, value) => setData((d) => ({ ...d, [col]: { ...d[col], [id]: value } })), [])
  const del = useCallback(
    (col, id) =>
      setData((d) => {
        const next = { ...d[col] }
        delete next[id]
        return { ...d, [col]: next }
      }),
    [],
  )

  const findByEmail = (email) =>
    Object.entries(data.team).find(([, u]) => (u.email || '').toLowerCase() === email.trim().toLowerCase())

  const profile = userId ? data.team[userId] || null : null

  return {
    mode: 'local',
    loading: false,
    userId: profile ? userId : null,
    profile,
    data,

    signIn: async (email, password, remember) => {
      const found = findByEmail(email)
      if (!found) throw fail('auth/user-not-found', 'No account uses that email. Create one first.')
      if ((found[1].password || '') !== password.trim()) throw fail('auth/invalid-credential', 'Email or password is wrong.')
      writeSession(found[0], remember)
      setUserId(found[0])
    },
    signUp: async (name, email, password, remember) => {
      if (findByEmail(email)) throw fail('auth/email-already-in-use', 'An account already uses that email. Sign in instead.')
      if (password.trim().length < 6) throw fail('auth/weak-password', 'Use a password with at least 6 characters.')
      const id = uid('u_')
      put('team', id, { displayName: name.trim(), email: email.trim().toLowerCase(), password: password.trim(), role: 'pending', createdAt: nowIso() })
      writeSession(id, remember)
      setUserId(id)
    },
    resetPassword: async () => {
      throw fail('demo', `In demo mode every demo account uses the password ${DEMO_PASSWORD}.`)
    },
    signOut: async () => {
      writeSession(null)
      setUserId(null)
    },

    saveCand: (id, c) => put('cands', id, c),
    saveReq: (id, r) => put('reqs', id, r),
    saveMember: (id, m) => put('team', id, m),
    removeCand: (id) => del('cands', id),
    removeMember: (id) => del('team', id),
    saveSettings: (s) => setData((d) => ({ ...d, settings: s })),
    seedExamples: () => {
      const s = makeSample(Date.now())
      setData((d) => ({ ...d, reqs: { ...d.reqs, ...s.reqs }, cands: { ...d.cands, ...s.cands } }))
    },
    clearExamples: () =>
      setData((d) => ({
        ...d,
        reqs: Object.fromEntries(Object.entries(d.reqs).filter(([, r]) => !r.example)),
        cands: Object.fromEntries(Object.entries(d.cands).filter(([, c]) => !c.example)),
      })),
    resetDemo: () => setData(freshData()),
  }
}
