import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

const CURRENT_USER_QUERY = gql`
  query CurrentUser {
    me {
      id
      email
      role
      applications {
        id
        status
      }
    }
  }
`

type ApplicationStatus =
  | 'SAVED'
  | 'APPLIED'
  | 'INTERVIEWING'
  | 'REJECTED'
  | 'OFFER'

type CurrentUserData = {
  me: {
    id: string
    email: string
    role: 'USER' | 'ADMIN'
    applications: Array<{
      id: string
      status: ApplicationStatus
    }>
  }
}

type AuthenticatedHomeProps = {
  onLogout: () => Promise<void>
}

export function AuthenticatedHome({ onLogout }: AuthenticatedHomeProps) {
  const { data, loading, error } = useQuery<CurrentUserData>(CURRENT_USER_QUERY)

  if (loading) {
    return (
      <main className="session-state">
        <span className="loading-ring" aria-hidden="true" />
        <p>Loading your GraphQL workspace…</p>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="session-state">
        <p className="eyebrow">Session unavailable</p>
        <h1>We could not load your account.</h1>
        <p>{error?.message ?? 'The API returned no user data.'}</p>
        <button className="secondary-button" onClick={() => void onLogout()}>
          Return to sign in
        </button>
      </main>
    )
  }

  const interviewing = data.me.applications.filter(
    (application) => application.status === 'INTERVIEWING',
  ).length
  const offers = data.me.applications.filter(
    (application) => application.status === 'OFFER',
  ).length

  return (
    <main className="workspace-shell">
      <header className="workspace-header">
        <div className="brand-lockup">
          <div className="brand-mark small" aria-hidden="true">
            JT
          </div>
          <div>
            <strong>Job Tracker</strong>
            <span>GraphQL workspace</span>
          </div>
        </div>
        <button className="text-button" onClick={() => void onLogout()}>
          Sign out
        </button>
      </header>

      <section className="workspace-content">
        <div className="welcome-row">
          <div>
            <p className="eyebrow">Apollo Client connected</p>
            <h1>Good to see you.</h1>
            <p>
              Signed in as <strong>{data.me.email}</strong>
            </p>
          </div>
          <span className="role-badge">{data.me.role}</span>
        </div>

        <div className="stat-grid" aria-label="Application summary">
          <article className="stat-card accent-card">
            <span>Total applications</span>
            <strong>{data.me.applications.length}</strong>
          </article>
          <article className="stat-card">
            <span>Interviewing</span>
            <strong>{interviewing}</strong>
          </article>
          <article className="stat-card">
            <span>Offers</span>
            <strong>{offers}</strong>
          </article>
        </div>

        <section className="next-step-card">
          <div>
            <p className="eyebrow">Foundation complete</p>
            <h2>The authenticated query is live.</h2>
            <p>
              Apollo normalized your user and application objects in its
              in-memory cache. The next slice will turn those records into the
              paginated application dashboard.
            </p>
          </div>
          <div className="query-chip">
            <span className="status-dot" aria-hidden="true" />
            CurrentUser query succeeded
          </div>
        </section>
      </section>
    </main>
  )
}
