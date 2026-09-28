import { useQuery } from '@apollo/client/react'
import { type FormEvent, useState } from 'react'

import { graphql } from '../gql'
import type { ApplicationFilter, ApplicationStatus } from '../gql/graphql'

const DASHBOARD_QUERY = graphql(`
  query Dashboard(
    $first: Int!
    $after: String
    $filter: ApplicationFilter
  ) {
    me {
      id
      email
      role
      applications {
        id
        status
      }
    }
    applicationPage(first: $first, after: $after, filter: $filter) {
      edges {
        cursor
        node {
          id
          role
          status
          createdAt
          company {
            id
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`)

const PAGE_SIZE = 5

const statusLabels: Record<ApplicationStatus, string> = {
  SAVED: 'Saved',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  REJECTED: 'Rejected',
  OFFER: 'Offer',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

type AuthenticatedHomeProps = {
  onLogout: () => Promise<void>
}

export function AuthenticatedHome({ onLogout }: AuthenticatedHomeProps) {
  const [status, setStatus] = useState<ApplicationStatus | ''>('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [filter, setFilter] = useState<ApplicationFilter | null>(null)
  const [after, setAfter] = useState<string | null>(null)
  const [cursorHistory, setCursorHistory] = useState<Array<string | null>>([])

  const { data, loading, error } = useQuery(DASHBOARD_QUERY, {
    variables: { first: PAGE_SIZE, after, filter },
    notifyOnNetworkStatusChange: true,
  })

  function resetPagination(nextFilter: ApplicationFilter | null) {
    setCursorHistory([])
    setAfter(null)
    setFilter(nextFilter)
  }

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextFilter: ApplicationFilter = {}
    if (status) nextFilter.status = status
    if (company.trim()) nextFilter.companyNameContains = company.trim()
    if (role.trim()) nextFilter.roleContains = role.trim()

    resetPagination(Object.keys(nextFilter).length > 0 ? nextFilter : null)
  }

  function clearFilters() {
    setStatus('')
    setCompany('')
    setRole('')
    resetPagination(null)
  }

  function showNextPage() {
    const endCursor = data?.applicationPage.pageInfo.endCursor
    if (!endCursor) return

    setCursorHistory((history) => [...history, after])
    setAfter(endCursor)
  }

  function showPreviousPage() {
    const previousCursor = cursorHistory.at(-1)
    setCursorHistory((history) => history.slice(0, -1))
    setAfter(previousCursor ?? null)
  }

  if (loading && !data) {
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
  const applications = data.applicationPage.edges.map((edge) => edge.node)
  const filtersActive = filter !== null

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
            <p className="eyebrow">Application pipeline</p>
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

        <section className="applications-section" aria-labelledby="applications-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Tracked opportunities</p>
              <h2 id="applications-heading">Applications</h2>
            </div>
            <span className="page-indicator">Page {cursorHistory.length + 1}</span>
          </div>

          <form className="filter-bar" onSubmit={handleFilter}>
            <label>
              <span>Status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ApplicationStatus | '')
                }
              >
                <option value="">All statuses</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Company</span>
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Search company"
              />
            </label>
            <label>
              <span>Role</span>
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="Search role"
              />
            </label>
            <button className="filter-button" disabled={loading} type="submit">
              Apply filters
            </button>
            {filtersActive ? (
              <button className="clear-button" onClick={clearFilters} type="button">
                Clear
              </button>
            ) : null}
          </form>

          <div className="application-list" aria-live="polite" aria-busy={loading}>
            {applications.length === 0 ? (
              <div className="empty-state">
                <span>0 results</span>
                <h3>No applications match these filters.</h3>
                <p>Try clearing a filter to widen the search.</p>
              </div>
            ) : (
              applications.map((application) => (
                <article className="application-row" key={application.id}>
                  <div className="company-initial" aria-hidden="true">
                    {application.company.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="application-identity">
                    <strong>{application.role}</strong>
                    <span>{application.company.name}</span>
                  </div>
                  <div className="application-meta">
                    <span>Added</span>
                    <strong>{formatDate(application.createdAt)}</strong>
                  </div>
                  <span
                    className={`status-badge status-${application.status.toLowerCase()}`}
                  >
                    {statusLabels[application.status]}
                  </span>
                </article>
              ))
            )}
            {loading ? <div className="list-loading">Refreshing…</div> : null}
          </div>

          <nav className="pagination" aria-label="Application pages">
            <button
              className="pagination-button"
              disabled={cursorHistory.length === 0 || loading}
              onClick={showPreviousPage}
              type="button"
            >
              ← Previous
            </button>
            <span>Page {cursorHistory.length + 1}</span>
            <button
              className="pagination-button"
              disabled={!data.applicationPage.pageInfo.hasNextPage || loading}
              onClick={showNextPage}
              type="button"
            >
              Next →
            </button>
          </nav>
        </section>
      </section>
    </main>
  )
}
