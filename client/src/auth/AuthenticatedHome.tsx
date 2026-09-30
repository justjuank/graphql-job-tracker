import { useQuery } from '@apollo/client/react'
import { type FormEvent, useState } from 'react'

import { CreateApplicationForm } from '../applications/CreateApplicationForm'
import { ApplicationDetailPanel } from '../applications/ApplicationDetailPanel'
import { ApplicationStatusSelect } from '../applications/ApplicationStatusSelect'
import { statusLabels } from '../applications/application-status'
import { DASHBOARD_QUERY } from '../applications/operations'
import type { ApplicationFilter, ApplicationStatus } from '../gql/graphql'
import {
  eyebrowClass,
  fieldClass,
  fieldLabelClass,
  primaryButtonClass,
  secondaryButtonClass,
  statusDotClass,
  successMessageClass,
} from '../ui/styles'

const PAGE_SIZE = 5

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
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createdMessage, setCreatedMessage] = useState<string | null>(null)
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null)

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

  function handleCreated(createdRole: string) {
    setStatus('')
    setCompany('')
    setRole('')
    resetPagination(null)
    setShowCreateForm(false)
    setCreatedMessage(`${createdRole} was added to your pipeline.`)
  }

  function handleDeleted(deletedRole: string) {
    setSelectedApplicationId(null)
    setCursorHistory([])
    setAfter(null)
    setCreatedMessage(`${deletedRole} was deleted from your pipeline.`)
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
      <main className="grid min-h-screen place-content-center justify-items-center gap-[18px] p-[30px] text-center">
        <span
          className="size-9 animate-spin rounded-full border-[3px] border-[#ccd2ca] border-t-brand"
          aria-hidden="true"
        />
        <p>Loading your GraphQL workspace…</p>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="grid min-h-screen place-content-center justify-items-center gap-[18px] p-[30px] text-center">
        <p className={eyebrowClass}>Session unavailable</p>
        <h1 className="font-display text-[clamp(2.4rem,6vw,4.2rem)] font-medium tracking-[-0.045em]">
          We could not load your account.
        </h1>
        <p className="m-0 max-w-[540px] text-muted">
          {error?.message ?? 'The API returned no user data.'}
        </p>
        <button
          className={`${primaryButtonClass} mt-3 min-h-[54px] gap-5 px-5`}
          onClick={() => void onLogout()}
        >
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
    <main className="min-h-screen">
      <header className="flex h-[78px] items-center justify-between bg-brand px-[18px] text-[#eff5ef] min-[521px]:px-[clamp(24px,5vw,72px)]">
        <div className="flex items-center gap-3">
          <div
            className="grid size-10 shrink-0 place-items-center rounded-[11px_3px_11px_3px] bg-lime text-[0.85rem] font-black tracking-[-0.04em] text-brand"
            aria-hidden="true"
          >
            JT
          </div>
          <div className="grid gap-0.5">
            <strong className="text-[0.9rem]">Job Tracker</strong>
            <span className="text-[0.7rem] text-[#eff5ef]/55">
              GraphQL workspace
            </span>
          </div>
        </div>
        <button
          className="border-0 border-b border-[#eff5ef]/30 bg-transparent px-0 py-2 text-[0.82rem] text-[#eff5ef]/75"
          onClick={() => void onLogout()}
        >
          Sign out
        </button>
      </header>

      <section className="mx-auto w-[min(1120px,calc(100%-32px))] pt-12 pb-[90px] min-[521px]:w-[min(1120px,calc(100%-48px))] min-[521px]:pt-[70px]">
        <div className="flex flex-col items-start justify-between gap-6 min-[521px]:flex-row min-[521px]:items-end">
          <div>
            <p className={eyebrowClass}>Application pipeline</p>
            <h1 className="font-display text-[clamp(3rem,6vw,5rem)] leading-none font-medium tracking-[-0.045em]">
              Good to see you.
            </h1>
            <p className="mt-3.5 mb-0 text-muted">
              Signed in as <strong>{data.me.email}</strong>
            </p>
          </div>
          <span className="mb-2 rounded-full border border-[#b9c7bd] bg-brand-soft px-3 py-2 text-[0.68rem] font-black tracking-[0.1em] text-brand">
            {data.me.role}
          </span>
        </div>

        <div
          className="mt-[52px] grid grid-cols-1 gap-4 min-[851px]:grid-cols-3"
          aria-label="Application summary"
        >
          <article className="flex min-h-[140px] flex-col justify-between border border-brand bg-brand p-6 min-[851px]:min-h-[170px]">
            <span className="text-[0.78rem] font-bold text-[#f3f7f1]">
              Total applications
            </span>
            <strong className="font-display text-[3.4rem] font-medium text-[#f3f7f1]">
              {data.me.applications.length}
            </strong>
          </article>
          <article className="flex min-h-[140px] flex-col justify-between border border-line bg-white/50 p-6 min-[851px]:min-h-[170px]">
            <span className="text-[0.78rem] font-bold text-muted">Interviewing</span>
            <strong className="font-display text-[3.4rem] font-medium text-ink">
              {interviewing}
            </strong>
          </article>
          <article className="flex min-h-[140px] flex-col justify-between border border-line bg-white/50 p-6 min-[851px]:min-h-[170px]">
            <span className="text-[0.78rem] font-bold text-muted">Offers</span>
            <strong className="font-display text-[3.4rem] font-medium text-ink">
              {offers}
            </strong>
          </article>
        </div>

        <section className="mt-16" aria-labelledby="applications-heading">
          <div className="mb-6 flex flex-col items-start justify-between gap-6 min-[521px]:flex-row min-[521px]:items-end">
            <div>
              <p className={eyebrowClass}>Tracked opportunities</p>
              <h2
                className="font-display text-[clamp(2.2rem,4vw,3.4rem)] font-medium tracking-[-0.04em]"
                id="applications-heading"
              >
                Applications
              </h2>
            </div>
            <div className="flex w-full items-center justify-between gap-[18px] min-[521px]:w-auto">
              <span className="text-[0.76rem] font-bold text-muted">
                Page {cursorHistory.length + 1}
              </span>
              <button
                aria-expanded={showCreateForm}
                className={primaryButtonClass}
                onClick={() => {
                  setCreatedMessage(null)
                  setShowCreateForm((visible) => !visible)
                }}
                type="button"
              >
                {showCreateForm ? 'Close form' : '+ Add application'}
              </button>
            </div>
          </div>

          {showCreateForm ? (
            <CreateApplicationForm
              onCancel={() => setShowCreateForm(false)}
              onCreated={handleCreated}
            />
          ) : null}

          {createdMessage ? (
            <div className={successMessageClass} role="status">
              <span className={statusDotClass} aria-hidden="true" />
              {createdMessage}
            </div>
          ) : null}

          <form
            className="grid grid-cols-1 items-end gap-3 border border-line bg-paper p-5 min-[521px]:grid-cols-2 min-[851px]:grid-cols-[0.8fr_1fr_1fr_auto_auto]"
            onSubmit={handleFilter}
          >
            <label className={fieldLabelClass}>
              <span>Status</span>
              <select
                className={fieldClass}
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
            <label className={fieldLabelClass}>
              <span>Company</span>
              <input
                className={fieldClass}
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="Search company"
              />
            </label>
            <label className={fieldLabelClass}>
              <span>Role</span>
              <input
                className={fieldClass}
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="Search role"
              />
            </label>
            <button className={primaryButtonClass} disabled={loading} type="submit">
              Apply filters
            </button>
            {filtersActive ? (
              <button className={secondaryButtonClass} onClick={clearFilters} type="button">
                Clear
              </button>
            ) : null}
          </form>

          <div
            className="relative min-h-[116px] border border-t-0 border-line bg-white/40"
            aria-live="polite"
            aria-busy={loading}
          >
            {applications.length === 0 ? (
              <div className="px-6 py-[54px] text-center">
                <span className="text-[0.7rem] font-black tracking-[0.1em] text-accent uppercase">
                  0 results
                </span>
                <h3 className="mt-2.5 mb-[7px] font-display text-2xl font-medium">
                  No applications match these filters.
                </h3>
                <p className="m-0 text-[0.85rem] text-muted">
                  Try clearing a filter to widen the search.
                </p>
              </div>
            ) : (
              applications.map((application) => (
                <article
                  className="grid min-h-[100px] grid-cols-[auto_1fr] items-center gap-5 border-b border-line p-5 last:border-b-0 min-[521px]:grid-cols-[auto_minmax(220px,1fr)_auto] min-[851px]:grid-cols-[auto_minmax(220px,1fr)_minmax(120px,auto)_auto]"
                  key={application.id}
                >
                  <div
                    className="grid size-11 place-items-center border border-[#c4cec6] bg-brand-soft font-display text-[1.15rem] font-bold text-brand"
                    aria-hidden="true"
                  >
                    {application.company.name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    className="group grid gap-[5px] border-0 bg-transparent px-0 py-1 text-left text-inherit"
                    onClick={() => setSelectedApplicationId(application.id)}
                    type="button"
                  >
                    <strong className="text-[0.95rem] group-hover:text-accent group-hover:underline group-hover:underline-offset-3 group-focus-visible:text-accent group-focus-visible:underline">
                      {application.role}
                    </strong>
                    <span className="text-[0.75rem] text-muted">
                      {application.company.name}
                    </span>
                  </button>
                  <div className="hidden gap-[5px] min-[851px]:grid">
                    <span className="text-[0.75rem] text-muted">Added</span>
                    <strong className="text-[0.78rem]">
                      {formatDate(application.createdAt)}
                    </strong>
                  </div>
                  <ApplicationStatusSelect
                    activeStatusFilter={filter?.status ?? null}
                    applicationId={application.id}
                    applicationRole={application.role}
                    status={application.status}
                  />
                </article>
              ))
            )}
            {loading ? (
              <div className="absolute inset-0 grid place-items-center bg-paper/80 text-[0.8rem] font-extrabold text-brand backdrop-blur-[2px]">
                Refreshing…
              </div>
            ) : null}
          </div>

          <nav
            className="mt-4 flex items-center justify-between gap-3.5 min-[521px]:justify-end"
            aria-label="Application pages"
          >
            <button
              className={secondaryButtonClass}
              disabled={cursorHistory.length === 0 || loading}
              onClick={showPreviousPage}
              type="button"
            >
              ← Previous
            </button>
            <span className="hidden text-[0.75rem] text-muted min-[521px]:inline">
              Page {cursorHistory.length + 1}
            </span>
            <button
              className={secondaryButtonClass}
              disabled={!data.applicationPage.pageInfo.hasNextPage || loading}
              onClick={showNextPage}
              type="button"
            >
              Next →
            </button>
          </nav>
        </section>
      </section>

      {selectedApplicationId ? (
        <ApplicationDetailPanel
          applicationId={selectedApplicationId}
          dashboardVariables={{ first: PAGE_SIZE, after, filter }}
          onClose={() => setSelectedApplicationId(null)}
          onDeleted={handleDeleted}
        />
      ) : null}
    </main>
  )
}
