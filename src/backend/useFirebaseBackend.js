import { useCallback, useEffect, useRef, useState } from 'react'
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
} from 'firebase/auth'
import { collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, setDoc, where, writeBatch } from 'firebase/firestore'
import { auth, db } from '../firebase.js'
import { makeSample } from '../sampleData.js'
import { nowIso } from '../utils.js'

// ─────────────────────────────────────────────────────────────────────────────
// One Hireline for many companies.
//   orgs/{orgId}                 company: name, ownerUid, joinCode
//   orgs/{orgId}/reqs/{id}       that company's client roles
//   orgs/{orgId}/cands/{id}      that company's candidates
//   joinCodes/{CODE}             code → company, so new people can join
//   users/{uid}                  person: name, email, orgId, role
// Whoever creates a company is its Admin. Others join with the company code
// and wait for that company's Admin to approve them.
// ─────────────────────────────────────────────────────────────────────────────

const MEMBER_ROLES = ['junior', 'senior', 'admin']
const EMPTY = { reqs: {}, cands: {}, team: {}, settings: {}, org: null }
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O or 1/I mix-ups

const makeCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('')
export const cleanCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '')

// Turn Firebase error codes into sentences people can act on.
export function authMessage(err) {
  const code = err?.code || ''
  const map = {
    'auth/invalid-credential': 'Email or password is wrong.',
    'auth/wrong-password': 'Email or password is wrong.',
    'auth/user-not-found': 'No account uses that email. Create one first.',
    'auth/invalid-email': 'That email address doesn’t look right.',
    'auth/email-already-in-use': 'An account already uses that email. Sign in instead.',
    'auth/weak-password': 'Use a password with at least 6 characters.',
    'auth/missing-password': 'Enter your password.',
    'auth/too-many-requests': 'Too many tries. Wait a few minutes, or reset your password.',
    'auth/network-request-failed': 'No internet connection. Check it and try again.',
    'auth/operation-not-allowed': 'Email sign-in is turned off in Firebase. Turn on Email/Password under Authentication → Sign-in method.',
    'permission-denied': 'Firebase refused this. Check that the latest security rules from firestore.rules are published.',
    'bad-code': 'That company code doesn’t match any company. Check it with your Admin.',
  }
  return map[code] || err?.message || 'Something went wrong. Try again.'
}

const fail = (code) => Object.assign(new Error(code), { code })
const toMap = (snap) => Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))

export function useFirebaseBackend(toast) {
  const [authUser, setAuthUser] = useState(undefined) // undefined = still checking
  const [profile, setProfile] = useState(undefined)
  const [data, setData] = useState(EMPTY)
  const busy = useRef(false) // true while sign-up is writing the profile

  // 1. Who is signed in? Firebase remembers the session on this device.
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setAuthUser(u)
        if (!u) {
          setProfile(null)
          setData(EMPTY)
        }
      }),
    [],
  )

  // Look up a company code. Readable before signing in, so a wrong code is caught early.
  const findCompany = useCallback(async (rawCode) => {
    const code = cleanCode(rawCode)
    if (code.length < 6) throw fail('bad-code')
    const snap = await getDoc(doc(db, 'joinCodes', code))
    if (!snap.exists()) throw fail('bad-code')
    return { code, ...snap.data() } // { code, orgId, orgName }
  }, [])

  // Put a signed-in person into a company: create one (they become its Admin) or join one (pending).
  const placeInCompany = useCallback(async (user, name, choice) => {
    const base = {
      displayName: (name || user.displayName || user.email.split('@')[0]).trim(),
      email: user.email,
      createdAt: nowIso(),
    }
    const userRef = doc(db, 'users', user.uid)
    if (choice.mode === 'create') {
      const orgRef = doc(collection(db, 'orgs'))
      let code = makeCode()
      for (let i = 0; i < 5 && (await getDoc(doc(db, 'joinCodes', code))).exists(); i++) code = makeCode()
      const orgName = choice.company.trim()
      const b = writeBatch(db)
      b.set(orgRef, { name: orgName, ownerUid: user.uid, joinCode: code, createdAt: nowIso() })
      b.set(doc(db, 'joinCodes', code), { orgId: orgRef.id, orgName })
      b.set(userRef, { ...base, orgId: orgRef.id, orgName, role: 'admin' })
      await b.commit()
    } else {
      const company = choice.company || (await findCompany(choice.code))
      await setDoc(userRef, { ...base, orgId: company.orgId, orgName: company.orgName, joinCode: company.code, role: 'pending' })
    }
  }, [findCompany])

  // 2. Watch this person's profile (company, role, approval).
  useEffect(() => {
    if (!authUser) return
    setProfile(undefined)
    const slow = setTimeout(() => {
      setProfile((p) =>
        p === undefined
          ? {
              role: 'error',
              error:
                'Hireline can’t reach its database. If you’re setting it up, create the Firestore Database in Firebase and publish the rules from firestore.rules, then refresh. Otherwise check your internet connection.',
            }
          : p,
      )
    }, 12000)
    const unsub = onSnapshot(
      doc(db, 'users', authUser.uid),
      (snap) => {
        if (snap.exists()) setProfile(snap.data())
        else if (!busy.current) setProfile({ role: 'none', displayName: authUser.displayName || '', email: authUser.email }) // signed in, no company yet
      },
      (e) => setProfile({ role: 'error', error: authMessage(e) }),
    )
    return () => {
      clearTimeout(slow)
      unsub()
    }
  }, [authUser])

  const orgId = profile?.orgId || null
  const isMember = Boolean(orgId && MEMBER_ROLES.includes(profile?.role))
  const isAdmin = isMember && profile?.role === 'admin'

  // 3. Live company data. Only approved members of this company can read it.
  useEffect(() => {
    if (!isMember || !orgId) return
    const onErr = (e) => toast(authMessage(e))
    const subs = [
      onSnapshot(collection(db, 'orgs', orgId, 'reqs'), (s) => setData((d) => ({ ...d, reqs: toMap(s) })), onErr),
      onSnapshot(collection(db, 'orgs', orgId, 'cands'), (s) => setData((d) => ({ ...d, cands: toMap(s) })), onErr),
      onSnapshot(query(collection(db, 'users'), where('orgId', '==', orgId)), (s) => setData((d) => ({ ...d, team: toMap(s) })), onErr),
      onSnapshot(
        doc(db, 'orgs', orgId),
        (s) => {
          const org = s.exists() ? s.data() : null
          setData((d) => ({ ...d, org, settings: { name: org?.name || '' } }))
        },
        onErr,
      ),
    ]
    return () => {
      subs.forEach((u) => u())
      setData(EMPTY)
    }
  }, [isMember, orgId, toast])

  // Writes. The screen updates straight away; Firebase syncs in the background.
  const write = useCallback((p) => p.catch((e) => toast(authMessage(e))), [toast])
  const orgDoc = (...path) => doc(db, 'orgs', orgId, ...path)

  return {
    mode: 'firebase',
    loading: authUser === undefined || (authUser && profile === undefined),
    userId: authUser?.uid || null,
    profile,
    data,

    findCompany,
    signIn: async (email, password, remember) => {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      await signInWithEmailAndPassword(auth, email.trim(), password)
    },
    // choice: { mode: 'create', company: 'Intech' } or { mode: 'join', code: 'K7P2QX' }
    signUp: async (name, email, password, remember, choice) => {
      const company = choice.mode === 'join' ? await findCompany(choice.code) : null // check the code before creating the account
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      busy.current = true
      try {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
        await updateProfile(cred.user, { displayName: name.trim() })
        await placeInCompany(cred.user, name, { ...choice, company: company || choice.company })
      } finally {
        busy.current = false
      }
    },
    // For a signed-in account that has no company yet (or was removed from one).
    setUpCompany: async (choice) => {
      busy.current = true
      try {
        await placeInCompany(auth.currentUser, profile?.displayName, choice)
      } finally {
        busy.current = false
      }
    },
    resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),
    signOut: () => fbSignOut(auth),

    saveCand: (id, c) => write(setDoc(orgDoc('cands', id), c)),
    saveReq: (id, r) => write(setDoc(orgDoc('reqs', id), r)),
    saveMember: (id, m) => write(setDoc(doc(db, 'users', id), m)),
    removeCand: (id) => write(deleteDoc(orgDoc('cands', id))),
    removeMember: (id) => write(deleteDoc(doc(db, 'users', id))),
    saveSettings: (s) => {
      const name = (s.name || '').trim()
      if (!name) return
      const b = writeBatch(db)
      b.update(orgDoc(), { name })
      if (data.org?.joinCode) b.update(doc(db, 'joinCodes', data.org.joinCode), { orgName: name })
      return write(b.commit())
    },

    seedExamples: () => {
      if (!isAdmin) return
      const s = makeSample(Date.now())
      const b = writeBatch(db)
      Object.entries(s.reqs).forEach(([id, r]) => b.set(orgDoc('reqs', id), r))
      Object.entries(s.cands).forEach(([id, c]) => b.set(orgDoc('cands', id), c))
      return write(b.commit())
    },
    clearExamples: async () => {
      const b = writeBatch(db)
      for (const name of ['cands', 'reqs']) {
        const snap = await getDocs(query(collection(db, 'orgs', orgId, name), where('example', '==', true)))
        snap.forEach((d) => b.delete(d.ref))
      }
      return write(b.commit())
    },
  }
}
