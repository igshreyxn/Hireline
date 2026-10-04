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

const MEMBER_ROLES = ['junior', 'senior', 'admin']
const EMPTY = { reqs: {}, cands: {}, team: {}, settings: {} }

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
    'permission-denied': 'Firebase refused this. Check that the security rules from firestore.rules are published.',
  }
  return map[code] || err?.message || 'Something went wrong. Try again.'
}

const toMap = (snap) => Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))

export function useFirebaseBackend(toast) {
  const [authUser, setAuthUser] = useState(undefined) // undefined = still checking
  const [profile, setProfile] = useState(undefined)
  const [data, setData] = useState(EMPTY)
  const creating = useRef(false)
  const signUpName = useRef('') // name typed on the sign-up form, used when the profile is created

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

  // Create the team profile for a new account. The very first account becomes Admin;
  // everyone after that waits for an Admin to approve them.
  const ensureProfile = useCallback(async (user, name) => {
    if (creating.current) return
    creating.current = true
    try {
      const ref = doc(db, 'users', user.uid)
      if ((await getDoc(ref)).exists()) return
      const base = {
        displayName: (name || signUpName.current || user.displayName || user.email.split('@')[0]).trim(),
        email: user.email,
        createdAt: nowIso(),
      }
      const setupRef = doc(db, 'meta', 'setup')
      const setup = await getDoc(setupRef)
      if (!setup.exists()) {
        try {
          const b = writeBatch(db)
          b.set(setupRef, { ownerUid: user.uid, createdAt: nowIso() })
          b.set(ref, { ...base, role: 'admin' })
          await b.commit()
          return
        } catch {
          /* someone else became admin first — fall through to pending */
        }
      }
      await setDoc(ref, { ...base, role: 'pending' })
    } finally {
      creating.current = false
    }
  }, [])

  // 2. Watch this person's profile (role changes, approval).
  useEffect(() => {
    if (!authUser) return
    setProfile(undefined)
    return onSnapshot(
      doc(db, 'users', authUser.uid),
      (snap) => {
        if (snap.exists()) setProfile(snap.data())
        else {
          setProfile(undefined)
          ensureProfile(authUser).catch((e) => setProfile({ role: 'error', error: authMessage(e) }))
        }
      },
      (e) => setProfile({ role: 'error', error: authMessage(e) }),
    )
  }, [authUser, ensureProfile])

  const isMember = Boolean(profile && MEMBER_ROLES.includes(profile.role))
  const isAdmin = profile?.role === 'admin'

  // 3. Live team data, shared by everyone. Only approved members can read it.
  useEffect(() => {
    if (!isMember) return
    const fail = (e) => toast(authMessage(e))
    const subs = [
      onSnapshot(collection(db, 'reqs'), (s) => setData((d) => ({ ...d, reqs: toMap(s) })), fail),
      onSnapshot(collection(db, 'cands'), (s) => setData((d) => ({ ...d, cands: toMap(s) })), fail),
      onSnapshot(collection(db, 'users'), (s) => setData((d) => ({ ...d, team: toMap(s) })), fail),
      onSnapshot(doc(db, 'settings', 'workspace'), (s) => setData((d) => ({ ...d, settings: s.exists() ? s.data() : {} })), fail),
    ]
    return () => subs.forEach((u) => u())
  }, [isMember, toast])

  // Writes. The screen updates straight away; Firebase syncs in the background.
  const write = useCallback(
    (p) =>
      p.catch((e) => {
        toast(authMessage(e))
      }),
    [toast],
  )

  const api = {
    mode: 'firebase',
    loading: authUser === undefined || (authUser && profile === undefined),
    userId: authUser?.uid || null,
    profile,
    data,

    signIn: async (email, password, remember) => {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      await signInWithEmailAndPassword(auth, email.trim(), password)
    },
    signUp: async (name, email, password, remember) => {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      signUpName.current = name
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await updateProfile(cred.user, { displayName: name.trim() })
      await ensureProfile(cred.user, name)
    },
    resetPassword: (email) => sendPasswordResetEmail(auth, email.trim()),
    signOut: () => fbSignOut(auth),

    saveCand: (id, c) => write(setDoc(doc(db, 'cands', id), c)),
    saveReq: (id, r) => write(setDoc(doc(db, 'reqs', id), r)),
    saveMember: (id, m) => write(setDoc(doc(db, 'users', id), m)),
    removeCand: (id) => write(deleteDoc(doc(db, 'cands', id))),
    removeMember: (id) => write(deleteDoc(doc(db, 'users', id))),
    saveSettings: (s) => write(setDoc(doc(db, 'settings', 'workspace'), s)),

    seedExamples: () => {
      if (!isAdmin) return
      const s = makeSample(Date.now())
      const b = writeBatch(db)
      Object.entries(s.reqs).forEach(([id, r]) => b.set(doc(db, 'reqs', id), r))
      Object.entries(s.cands).forEach(([id, c]) => b.set(doc(db, 'cands', id), c))
      return write(b.commit())
    },
    clearExamples: async () => {
      const b = writeBatch(db)
      for (const name of ['cands', 'reqs']) {
        const snap = await getDocs(query(collection(db, name), where('example', '==', true)))
        snap.forEach((d) => b.delete(d.ref))
      }
      return write(b.commit())
    },
  }
  return api
}
