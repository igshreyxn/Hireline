import { useCallback, useEffect, useState } from 'react'
import { AppContext } from './store.jsx'
import { DEMO_USERS, stageLabel } from './constants.js'
import { clone, nowIso } from './utils.js'
import { firebaseReady } from './firebase.js'
import { useFirebaseBackend } from './backend/useFirebaseBackend.js'
import { useLocalBackend } from './backend/useLocalBackend.js'
import Login from './components/Login.jsx'
import Pending from './components/Pending.jsx'
import CompanySetup from './components/CompanySetup.jsx'
import Header from './components/Header.jsx'
import Today from './components/Today.jsx'
import Pipeline from './components/Pipeline.jsx'
import Roles from './components/Roles.jsx'
import Team from './components/Team.jsx'
import CandidateDrawer from './components/CandidateDrawer.jsx'
import Modal from './components/Modal.jsx'
import Splash from './components/Splash.jsx'

// Firebase when it's set up in src/firebaseConfig.js, otherwise demo mode in this browser.
const useBackend = firebaseReady ? useFirebaseBackend : useLocalBackend

export default function App() {
  const [view, setView] = useState('today')
  const [filterReq, setFilterReq] = useState('all')
  const [openCand, setOpenCand] = useState(null)
  const [modal, setModal] = useState(null)
  const [toastMsg, setToastMsg] = useState('')
  const [, setTick] = useState(0)

  const toast = useCallback((msg) => {
    setToastMsg(msg)
    clearTimeout(toast._t)
    toast._t = setTimeout(() => setToastMsg(''), 3200)
  }, [])

  const be = useBackend(toast)
  const { data, userId, profile } = be

  // Re-render every 30s so offer countdowns stay current.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30e3)
    return () => clearInterval(t)
  }, [])

  // Close drawer / modal with Escape.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (modal) setModal(null)
      else setOpenCand(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal])

  // Lets the form helper (formShim.js) show "field is needed" messages.
  useEffect(() => {
    window.hirelineToast = toast
  }, [toast])

  const toastEl = toastMsg && <div className="toast">{toastMsg}</div>

  if (be.loading) {
    return (
      <>
        <div className="login-wrap">
          <p className="muted">
            <span className="spin" /> Signing you in…
          </p>
        </div>
        <Splash />
      </>
    )
  }

  if (!userId || !profile) {
    return (
      <>
        <Login backend={be} />
        <Splash />
        {toastEl}
      </>
    )
  }

  if (be.mode === 'firebase' && profile.role !== 'error' && (profile.role === 'none' || !profile.orgId)) {
    return (
      <>
        <CompanySetup profile={profile} backend={be} />
        {toastEl}
      </>
    )
  }

  if (!['junior', 'senior', 'admin'].includes(profile.role)) {
    return (
      <>
        <Pending profile={profile} onSignOut={be.signOut} />
        {toastEl}
      </>
    )
  }

  const role = profile.role
  const personName = (id) =>
    data.team[id]?.displayName || DEMO_USERS.find((u) => u.id === id)?.name || 'Teammate'

  const moveStage = (id, stage, extra = {}, noteText = '') => {
    const c = clone(data.cands[id])
    c.stage = stage
    c.history = [...(c.history || []), { stage, at: nowIso(), by: userId }]
    Object.assign(c, extra)
    if (noteText.trim()) c.notes = [...(c.notes || []), { text: noteText.trim(), by: userId, at: nowIso() }]
    c.updatedAt = nowIso()
    be.saveCand(id, c)
    toast(`Moved to ${stageLabel(stage)}`)
  }

  const logout = () => {
    setOpenCand(null)
    setModal(null)
    setView('today')
    be.signOut()
  }

  const ctx = {
    data,
    userId,
    me: profile,
    role,
    mode: be.mode,
    isSenior: role === 'senior' || role === 'admin',
    isAdmin: role === 'admin',
    personName,
    reqOf: (c) => data.reqs[c.reqId] || { title: 'Unknown role', client: '—' },
    overBudget: (c) => {
      const r = data.reqs[c.reqId]
      return r && c.expectedCtc !== '' && c.expectedCtc != null && +c.expectedCtc > +r.ctcMax
    },
    saveCand: be.saveCand,
    saveReq: be.saveReq,
    saveMember: be.saveMember,
    removeCand: be.removeCand,
    removeMember: be.removeMember,
    saveSettings: be.saveSettings,
    seedExamples: be.seedExamples,
    clearExamples: be.clearExamples,
    resetDemo: be.resetDemo,
    moveStage,
    toast,
    setView,
    setFilterReq,
    filterReq,
    openCandidate: setOpenCand,
    openModal: setModal,
    closeModal: () => setModal(null),
  }

  return (
    <AppContext.Provider value={ctx}>
      <Header view={view} onNav={(v) => { setView(v); window.scrollTo(0, 0) }} onLogout={logout} />
      <main>
        {be.mode === 'local' && (
          <div className="banner info">
            Demo mode: data is saved in this browser only. Paste your Firebase config into src/firebaseConfig.js to share
            one database with the whole team.
          </div>
        )}
        {view === 'today' && <Today />}
        {view === 'pipeline' && <Pipeline />}
        {view === 'roles' && <Roles />}
        {view === 'team' && <Team />}
      </main>
      {openCand && data.cands[openCand] && (
        <CandidateDrawer key={openCand + data.cands[openCand].stage} id={openCand} onClose={() => setOpenCand(null)} />
      )}
      {modal && <Modal modal={modal} />}
      {toastEl}
      <Splash />
    </AppContext.Provider>
  )
}
