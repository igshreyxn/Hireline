import Avatar from './Avatar.jsx'

// Shown to a new account until an Admin approves it (or if the profile couldn't load).
export default function Pending({ profile, onSignOut }) {
  const failed = profile.role === 'error'
  return (
    <div className="login-wrap">
      <div className="panel" style={{ maxWidth: 460, width: '100%', gap: 14 }}>
        {!failed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar id={profile.email || 'you'} name={profile.displayName} size={40} />
            <div>
              <b>{profile.displayName}</b>
              <div className="faint" style={{ fontSize: 13 }}>
                {profile.email}
              </div>
            </div>
          </div>
        )}
        <h2 style={{ fontSize: 22 }}>{failed ? 'We couldn’t load your account' : 'Waiting for approval'}</h2>
        <p className="muted" style={{ margin: 0 }}>
          {failed
            ? profile.error
            : 'Your account is created. An Admin needs to approve it and choose your role before you can see the pipeline. Ask them to open Team in Hireline. This page updates by itself once you’re approved.'}
        </p>
        <div>
          <button className="btn" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
