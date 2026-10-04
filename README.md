# Hireline

Recruitment desk for an agency team: client roles, a candidate pipeline from job portal to signed offer, 24-hour offer timers, feedback chasing, and team accounts with roles (Admin, Senior HR, Junior HR).

Built with React + Vite + Firebase (Authentication + Firestore). Installable as an app on phones and laptops.

---

## How accounts work

- People create their own account with **name, email and password**.
- The **first account ever created becomes the Admin**.
- Every account after that shows **"Waiting for approval"** until the Admin approves it in **Team** and picks a role (Junior HR or Senior HR).
- **Keep me signed in** (on by default) remembers the login on that device. Untick it on shared computers.
- **Forgot password?** emails a reset link.
- Removing someone in Team cuts their access straight away.

Until Firebase is connected, the app runs in **demo mode** (data stays in that browser, demo logins use password `demo123`).

---

## Connect Firebase (about 10 minutes, free plan is enough)

### 1. Create the project
1. Go to https://console.firebase.google.com and click **Create a project**. Name it `hireline`. Google Analytics is not needed.

### 2. Turn on email + password login
1. Left menu → **Build → Authentication** → **Get started**.
2. **Sign-in method** tab → **Email/Password** → turn on the first switch → **Save**.

### 3. Create the database
1. Left menu → **Build → Firestore Database** → **Create database**.
2. Location: **asia-south1 (Mumbai)**. Start in **production mode**.
3. Open the **Rules** tab, delete what's there, paste everything from `firestore.rules` in this folder, click **Publish**.

### 4. Copy your config into the app
1. Click the gear icon → **Project settings** → scroll to **Your apps** → click the web icon **</>**.
2. App nickname `hireline-web` → **Register app**. Firebase shows a `firebaseConfig = { ... }` block.
3. In **Vercel → your project → Settings → Environment Variables**, add the six names from `.env.example`
   (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, …) with the matching values from that block.
4. Go to **Deployments** → on the latest one click **⋯ → Redeploy** so the new values are used.

   (Alternative: paste the values straight into `src/firebaseConfig.js` and commit.)

### 5. Allow your website address
1. **Authentication → Settings → Authorized domains → Add domain**.
2. Add your Vercel address, e.g. `hireline-xyz.vercel.app`.

### 6. First sign-up
Open the site, choose **Create account**. That first account is the Admin. Then send the link to the team and approve each person in **Team**.

To try things out, Admin can click **Load example data** in Team, then **Remove example data** before real use.

---

## Run on your computer
```
npm install
npm run dev
```

## Deploy on Vercel
Upload this folder to GitHub and import it in Vercel. It detects Vite automatically
(build command `npm run build`, output folder `dist`).

## Folder layout
- `.env.example` — the Firebase settings to add in Vercel
- `src/firebaseConfig.js` — reads those settings (or paste them here directly)
- `src/firebase.js` — connects to Firebase
- `src/backend/useFirebaseBackend.js` — accounts, approvals, live shared data
- `src/backend/useLocalBackend.js` — demo mode (no Firebase)
- `src/components/` — Login (sign in / create account / reset), Pending, Today, Pipeline, Roles, Team, CandidateDrawer, Modal, Splash
- `firestore.rules` — who can read and change what
- `public/` — app icon, manifest and offline support
