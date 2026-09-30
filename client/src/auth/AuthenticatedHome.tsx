import { useQuery } from '@apollo/client/react'
import { useState } from 'react'

import { ApplicationDetailPanel } from '../applications/ApplicationDetailPanel'
import { CreateApplicationForm } from '../applications/CreateApplicationForm'
import { DASHBOARD_QUERY } from '../applications/operations'
import { ApplicationFilters } from '../dashboard/ApplicationFilters'
import {
  ApplicationList,
  ApplicationPagination,
} from '../dashboard/ApplicationList'
import { DashboardSummary } from '../dashboard/DashboardSummary'
import { WorkspaceHeader } from '../dashboard/WorkspaceHeader'
import type { ApplicationFilter, ApplicationStatus } from '../gql/graphql'
import { Alert, Spinner } from '../ui/Feedback'
import { Button } from '../ui/Button'
import { Eyebrow } from '../ui/Typography'

const PAGE_SIZE = 5

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

  function applyFilters() {
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
    clearFilters()
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
        <Spinner />
        <p>Loading your GraphQL workspace…</p>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="grid min-h-screen place-content-center justify-items-center gap-[18px] p-[30px] text-center">
        <Eyebrow>Session unavailable</Eyebrow>
        <h1 className="font-display text-[clamp(2.4rem,6vw,4.2rem)] font-medium tracking-[-0.045em]">
          We could not load your account.
        </h1>
        <p className="m-0 max-w-[540px] text-muted">
          {error?.message ?? 'The API returned no user data.'}
        </p>
        <Button
          className="mt-3 gap-5"
          onClick={() => void onLogout()}
          size="tall"
        >
          Return to sign in
        </Button>
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
  const currentPage = cursorHistory.length + 1

  return (
    <main className="min-h-screen">
      <WorkspaceHeader onLogout={onLogout} />

      <section className="mx-auto w-[min(1120px,calc(100%_-_32px))] pt-12 pb-[90px] min-[521px]:w-[min(1120px,calc(100%_-_48px))] min-[521px]:pt-[70px]">
        <DashboardSummary
          email={data.me.email}
          interviewing={interviewing}
          offers={offers}
          role={data.me.role}
          total={data.me.applications.length}
        />

        <section className="mt-16" aria-labelledby="applications-heading">
          <div className="mb-6 flex flex-col items-start justify-between gap-6 min-[521px]:flex-row min-[521px]:items-end">
            <div>
              <Eyebrow>Tracked opportunities</Eyebrow>
              <h2
                className="font-display text-[clamp(2.2rem,4vw,3.4rem)] font-medium tracking-[-0.04em]"
                id="applications-heading"
              >
                Applications
              </h2>
            </div>
            <div className="flex w-full items-center justify-between gap-[18px] min-[521px]:w-auto">
              <span className="text-[0.76rem] font-bold text-muted">
                Page {currentPage}
              </span>
              <Button
                aria-expanded={showCreateForm}
                onClick={() => {
                  setCreatedMessage(null)
                  setShowCreateForm((visible) => !visible)
                }}
              >
                {showCreateForm ? 'Close form' : '+ Add application'}
              </Button>
            </div>
          </div>

          {showCreateForm ? (
            <CreateApplicationForm
              onCancel={() => setShowCreateForm(false)}
              onCreated={handleCreated}
            />
          ) : null}

          {createdMessage ? <Alert variant="success">{createdMessage}</Alert> : null}

          <ApplicationFilters
            company={company}
            filtersActive={filter !== null}
            loading={loading}
            onClear={clearFilters}
            onCompanyChange={setCompany}
            onRoleChange={setRole}
            onStatusChange={setStatus}
            onSubmit={applyFilters}
            role={role}
            status={status}
          />
          <ApplicationList
            activeStatusFilter={filter?.status ?? null}
            applications={applications}
            loading={loading}
            onSelect={setSelectedApplicationId}
          />
          <ApplicationPagination
            hasNextPage={data.applicationPage.pageInfo.hasNextPage}
            loading={loading}
            onNext={showNextPage}
            onPrevious={showPreviousPage}
            page={currentPage}
          />
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
