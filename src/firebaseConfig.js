// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE CONFIG
//
// Option A (recommended): add these as Environment Variables in Vercel
//   (Project → Settings → Environment Variables), using the names in .env.example.
//   For your own computer, copy .env.example to .env and fill it in.
//
// Option B: paste the values straight into the fallback strings below.
//
// Find the values in Firebase console → Project settings → Your apps → Web app → Config.
// They only identify your project; who can read data is decided by firestore.rules.
//
// While no apiKey is set, Hireline runs in demo mode on this device.
// ─────────────────────────────────────────────────────────────────────────────

const env = import.meta.env

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'PASTE_YOUR_API_KEY',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'your-project.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'your-project',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'your-project.appspot.com',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000',
}
