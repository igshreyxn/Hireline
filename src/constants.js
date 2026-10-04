export const STAGES = [
  { k: 'sourced', label: 'Sourced', hint: 'Found on a job portal' },
  { k: 'screened', label: 'Screened', hint: 'Junior HR call done' },
  { k: 'briefed', label: 'Senior HR call', hint: 'Role explained to candidate' },
  { k: 'submitted', label: 'Sent to client', hint: 'Waiting for client feedback' },
  { k: 'shortlisted', label: 'Client shortlisted', hint: 'Positive feedback' },
  { k: 'interview', label: 'G-Meet round', hint: 'Final call with our HR' },
  { k: 'offer', label: 'Offer · 24h', hint: 'Letter sent, 24h to sign' },
  { k: 'signed', label: 'Signed', hint: 'Offer letter signed' },
]

export const CLOSED = {
  rejected: 'Client rejected',
  dropped: 'Candidate dropped',
  expired: 'Did not sign in 24h',
}

export const STAGE_IDX = Object.fromEntries(STAGES.map((s, i) => [s.k, i]))
export const stageLabel = (k) => STAGES[STAGE_IDX[k]]?.label || CLOSED[k] || k

export const ROLES = { junior: 'Junior HR', senior: 'Senior HR', admin: 'Admin' }
export const SOURCES = ['Naukri', 'LinkedIn', 'Indeed', 'Foundit', 'Referral', 'Company database', 'Other']

export const H = 3600e3
export const D = 24 * H

export const DEMO_PASSWORD = 'demo123'
export const DEMO_USERS = [
  { id: 'd_admin', email: 'admin@demo.hire', name: 'Meera Iyer', role: 'admin' },
  { id: 'd_senior', email: 'senior@demo.hire', name: 'Ananya Sen', role: 'senior' },
  { id: 'd_junior1', email: 'rahul@demo.hire', name: 'Rahul Das', role: 'junior' },
  { id: 'd_junior2', email: 'priya@demo.hire', name: 'Priya Nair', role: 'junior' },
]
