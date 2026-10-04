import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { firebaseConfig } from './firebaseConfig.js'

// Firebase is used only once a real config has been pasted into firebaseConfig.js.
export const firebaseReady = Boolean(firebaseConfig.apiKey) && !firebaseConfig.apiKey.startsWith('PASTE')

export const app = firebaseReady ? initializeApp(firebaseConfig) : null
export const auth = app ? getAuth(app) : null

// The local cache keeps the app usable on a weak connection; changes sync when back online.
function makeDb() {
  try {
    return initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })
  } catch {
    return initializeFirestore(app, {})
  }
}
export const db = app ? makeDb() : null
