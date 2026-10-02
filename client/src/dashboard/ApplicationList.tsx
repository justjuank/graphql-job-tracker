import type { DashboardQuery } from '../gql/graphql'
import type { ApplicationStatus } from '../gql/graphql'
import { ApplicationStatusSelect } from '../applications/ApplicationStatusSelect'
import { Button } from '../ui/Button'

type Application = DashboardQuery['applicationPage']['edges'][number]['node']

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

type ApplicationRowProps = {
  activeStatusFilter: ApplicationStatus | null
  application: Application
  onSelect: (id: string) => void
}

function ApplicationRow({
  activeStatusFilter,
  application,
  onSelect,
}: ApplicationRowProps) {
  return (
    <article className="grid min-h-[100px] grid-cols-[auto_1fr] items-center gap-5 border-b border-line p-5 last:border-b-0 min-[521px]:grid-cols-[auto_minmax(220px,1fr)_auto] min-[851px]:grid-cols-[auto_minmax(220px,1fr)_minmax(120px,auto)_auto]">
      <div
        className="grid size-11 place-items-center border border-[#c4cec6] bg-brand-soft font-display text-[1.15rem] font-bold text-brand"
        aria-hidden="true"
      >
        {application.company.name.charAt(0).toUpperCase()}
      </div>
      <div className="grid gap-[5px] py-1">
        <button
          className="group grid w-fit gap-[5px] border-0 bg-transparent p-0 text-left text-inherit"
          onClick={() => onSelect(application.id)}
          type="button"
        >
          <strong className="text-[0.95rem] group-hover:text-accent group-hover:underline group-hover:underline-offset-3 group-focus-visible:text-accent group-focus-visible:underline">
            {application.role}
          </strong>
          <span className="text-[0.75rem] text-muted">
            {application.company.name}
          </span>
        </button>
        {application.jobPostingUrl ? (
          <a
            className="w-fit text-[0.72rem] font-extrabold text-accent underline decoration-accent/35 underline-offset-3 hover:decoration-accent"
            href={application.jobPostingUrl}
            rel="noreferrer"
            target="_blank"
          >
            View posting ↗
          </a>
        ) : null}
      </div>
      <div className="hidden gap-[5px] min-[851px]:grid">
        <span className="text-[0.75rem] text-muted">Added</span>
        <strong className="text-[0.78rem]">
          {formatDate(application.createdAt)}
        </strong>
      </div>
      <ApplicationStatusSelect
        activeStatusFilter={activeStatusFilter}
        applicationId={application.id}
        applicationRole={application.role}
        status={application.status}
      />
    </article>
  )
}

type ApplicationListProps = {
  activeStatusFilter: ApplicationStatus | null
  applications: Application[]
  loading: boolean
  onSelect: (id: string) => void
}

export function ApplicationList({
  activeStatusFilter,
  applications,
  loading,
  onSelect,
}: ApplicationListProps) {
  return (
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
          <ApplicationRow
            activeStatusFilter={activeStatusFilter}
            application={application}
            key={application.id}
            onSelect={onSelect}
          />
        ))
      )}
      {loading ? (
        <div className="absolute inset-0 grid place-items-center bg-paper/80 text-[0.8rem] font-extrabold text-brand backdrop-blur-[2px]">
          Refreshing…
        </div>
      ) : null}
    </div>
  )
}

type ApplicationPaginationProps = {
  hasNextPage: boolean
  loading: boolean
  onNext: () => void
  onPrevious: () => void
  page: number
}

export function ApplicationPagination({
  hasNextPage,
  loading,
  onNext,
  onPrevious,
  page,
}: ApplicationPaginationProps) {
  return (
    <nav
      className="mt-4 flex items-center justify-between gap-3.5 min-[521px]:justify-end"
      aria-label="Application pages"
    >
      <Button
        disabled={page === 1 || loading}
        onClick={onPrevious}
        variant="secondary"
      >
        ← Previous
      </Button>
      <span className="hidden text-[0.75rem] text-muted min-[521px]:inline">
        Page {page}
      </span>
      <Button
        disabled={!hasNextPage || loading}
        onClick={onNext}
        variant="secondary"
      >
        Next →
      </Button>
    </nav>
  )
}
