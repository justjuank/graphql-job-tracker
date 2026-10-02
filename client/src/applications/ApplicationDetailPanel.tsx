import { useMutation, useQuery } from '@apollo/client/react'
import { type FormEvent, useState } from 'react'

import type {
  ApplicationDetailQuery,
  ApplicationStatus,
  DashboardQueryVariables,
  InterviewType,
} from '../gql/graphql'
import { Button } from '../ui/Button'
import { Alert, Spinner } from '../ui/Feedback'
import { FormField, Input, Select } from '../ui/FormField'
import { Eyebrow } from '../ui/Typography'
import { statusLabels } from './application-status'
import { StatusBadge } from './StatusBadge'
import {
  ADD_INTERVIEW_MUTATION,
  APPLICATION_DETAIL_QUERY,
  DASHBOARD_QUERY,
  DELETE_APPLICATION_MUTATION,
  UPDATE_APPLICATION_MUTATION,
} from './operations'

const interviewTypeLabels: Record<InterviewType, string> = {
  PHONE_SCREEN: 'Phone screen',
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  ONSITE: 'On-site',
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

type ApplicationDetailPanelProps = {
  applicationId: string
  dashboardVariables: DashboardQueryVariables
  onClose: () => void
  onDeleted: (role: string) => void
}

export function ApplicationDetailPanel({
  applicationId,
  dashboardVariables,
  onClose,
  onDeleted,
}: ApplicationDetailPanelProps) {
  const { data, loading, error } = useQuery(APPLICATION_DETAIL_QUERY, {
    variables: { id: applicationId },
  })

  return (
    <div
      className="fixed inset-0 z-20 flex justify-end bg-[#0a1c16]/50 backdrop-blur-[3px]"
      role="presentation"
    >
      <section
        aria-labelledby="application-detail-heading"
        aria-modal="true"
        className="relative z-2 h-full w-full overflow-y-auto bg-paper px-[22px] pt-[52px] pb-[60px] text-ink shadow-[-24px_0_70px_rgb(9_27_21_/_20%)] min-[521px]:w-[min(600px,92vw)] min-[521px]:px-[42px] min-[521px]:pb-[70px]"
        role="dialog"
      >
        <Button
          aria-label="Close application details"
          className="absolute top-5 right-[22px] rounded-full border-line text-[1.35rem] text-muted"
          onClick={onClose}
          size="icon"
          variant="secondary"
        >
          ×
        </Button>

        {loading ? (
          <div className="grid min-h-[70vh] place-content-center justify-items-center gap-[15px] text-center">
            <Spinner />
            <p>Loading application details…</p>
          </div>
        ) : null}

        {error ? (
          <div className="grid min-h-[70vh] place-content-center justify-items-center gap-[15px] text-center">
            <Eyebrow>Unable to load</Eyebrow>
            <h2
              className="font-display text-[clamp(2.2rem,5vw,3.6rem)] font-medium tracking-[-0.04em] text-ink"
              id="application-detail-heading"
            >
              Application unavailable
            </h2>
            <p className="leading-[1.55] text-muted">{error.message}</p>
          </div>
        ) : null}

        {!loading && !error && !data?.application ? (
          <div className="grid min-h-[70vh] place-content-center justify-items-center gap-[15px] text-center">
            <Eyebrow>Not found</Eyebrow>
            <h2
              className="font-display text-[clamp(2.2rem,5vw,3.6rem)] font-medium tracking-[-0.04em] text-ink"
              id="application-detail-heading"
            >
              Application unavailable
            </h2>
          </div>
        ) : null}

        {data?.application ? (
          <ApplicationDetailContent
            application={data.application}
            dashboardVariables={dashboardVariables}
            onDeleted={onDeleted}
          />
        ) : null}
      </section>
      <button
        aria-label="Close application details"
        className="absolute inset-0 z-1 w-full border-0 bg-transparent"
        onClick={onClose}
        type="button"
      />
    </div>
  )
}

type Application = NonNullable<ApplicationDetailQuery['application']>

type ApplicationDetailContentProps = {
  application: Application
  dashboardVariables: DashboardQueryVariables
  onDeleted: (role: string) => void
}

function ApplicationDetailContent({
  application,
  dashboardVariables,
  onDeleted,
}: ApplicationDetailContentProps) {
  const [role, setRole] = useState(application.role)
  const [companyName, setCompanyName] = useState(application.company.name)
  const [jobPostingUrl, setJobPostingUrl] = useState(
    application.jobPostingUrl ?? '',
  )
  const [status, setStatus] = useState<ApplicationStatus>(application.status)
  const [interviewType, setInterviewType] =
    useState<InterviewType>('PHONE_SCREEN')
  const [scheduledAt, setScheduledAt] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [updateApplication, updateResult] = useMutation(
    UPDATE_APPLICATION_MUTATION,
  )
  const [addInterview, interviewResult] = useMutation(ADD_INTERVIEW_MUTATION)
  const [deleteApplication, deleteResult] = useMutation(
    DELETE_APPLICATION_MUTATION,
  )

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)

    try {
      await updateApplication({
        variables: {
          id: application.id,
          input: {
            companyName: companyName.trim(),
            role: role.trim(),
            jobPostingUrl: jobPostingUrl.trim() || null,
            status,
          },
        },
        refetchQueries: [DASHBOARD_QUERY],
        awaitRefetchQueries: true,
      })
      setNotice('Application details updated.')
    } catch {
      // Apollo exposes the mutation error below.
    }
  }

  async function handleAddInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)

    try {
      await addInterview({
        variables: {
          input: {
            applicationId: application.id,
            type: interviewType,
            scheduledAt: new Date(scheduledAt).toISOString(),
          },
        },
        refetchQueries: [APPLICATION_DETAIL_QUERY],
        awaitRefetchQueries: true,
      })
      setScheduledAt('')
      setNotice('Interview added.')
    } catch {
      // Apollo exposes the mutation error below.
    }
  }

  async function handleDelete() {
    try {
      await deleteApplication({
        variables: { id: application.id },
        update(cache, result) {
          const deletedId = result.data?.deleteApplication.deletedApplicationId
          if (!deletedId) return

          cache.updateQuery(
            { query: DASHBOARD_QUERY, variables: dashboardVariables },
            (dashboard) => {
              if (!dashboard) return dashboard

              return {
                ...dashboard,
                me: {
                  ...dashboard.me,
                  applications: dashboard.me.applications.filter(
                    (item) => item.id !== deletedId,
                  ),
                },
                applicationPage: {
                  ...dashboard.applicationPage,
                  edges: dashboard.applicationPage.edges.filter(
                    (edge) => edge.node.id !== deletedId,
                  ),
                },
              }
            },
          )

          cache.evict({
            id: cache.identify({
              __typename: 'JobApplication',
              id: deletedId,
            }),
          })
          cache.gc()
        },
        refetchQueries: [DASHBOARD_QUERY],
        awaitRefetchQueries: true,
      })
      onDeleted(application.role)
    } catch {
      // Apollo exposes the mutation error below.
    }
  }

  const mutationError =
    updateResult.error ?? interviewResult.error ?? deleteResult.error

  return (
    <div className="grid gap-[30px]">
      <header className="pr-[30px]">
        <Eyebrow>Application details</Eyebrow>
        <h2
          className="font-display text-[clamp(2.2rem,5vw,3.6rem)] font-medium tracking-[-0.04em] text-ink"
          id="application-detail-heading"
        >
          {application.role}
        </h2>
        <p className="mt-3 mb-0 text-[0.84rem] leading-[1.55] text-muted">
          {application.company.name} · Added {formatDateTime(application.createdAt)}
        </p>
        <div className="mt-4">
          <StatusBadge status={application.status} />
        </div>
        {application.jobPostingUrl ? (
          <a
            className="mt-4 inline-flex text-[0.8rem] font-extrabold text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
            href={application.jobPostingUrl}
            rel="noreferrer"
            target="_blank"
          >
            View job posting ↗
          </a>
        ) : null}
      </header>

      {notice ? <Alert variant="success">{notice}</Alert> : null}

      {mutationError ? (
        <Alert variant="error">{mutationError.message}</Alert>
      ) : null}

      <form
        className="grid grid-cols-1 gap-4 border-t border-line pt-7 min-[521px]:grid-cols-2"
        onSubmit={handleUpdate}
      >
        <h3 className="font-display text-[1.35rem] font-medium tracking-[-0.04em] text-ink min-[521px]:col-span-2">
          Edit application
        </h3>
        <FormField label="Company">
          <Input
            className="h-[46px]"
            maxLength={120}
            onChange={(event) => setCompanyName(event.target.value)}
            required
            value={companyName}
          />
        </FormField>
        <FormField label="Role">
          <Input
            className="h-[46px]"
            maxLength={160}
            onChange={(event) => setRole(event.target.value)}
            required
            value={role}
          />
        </FormField>
        <FormField label="Status">
          <Select
            className="h-[46px]"
            onChange={(event) =>
              setStatus(event.target.value as ApplicationStatus)
            }
            value={status}
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField
          className="min-[521px]:col-span-2"
          label="Job posting URL (optional)"
        >
          <Input
            className="h-[46px]"
            maxLength={2048}
            onChange={(event) => setJobPostingUrl(event.target.value)}
            placeholder="https://company.com/jobs/backend-engineer"
            type="url"
            value={jobPostingUrl}
          />
        </FormField>
        <Button
          className="justify-self-end min-[521px]:col-span-2"
          disabled={updateResult.loading}
          type="submit"
        >
          {updateResult.loading ? 'Saving…' : 'Save changes'}
        </Button>
      </form>

      <section className="border-t border-line pt-7">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-[1.35rem] font-medium tracking-[-0.04em] text-ink">
            Interviews
          </h3>
          <span className="grid h-7 min-w-7 place-items-center rounded-full bg-brand-soft text-[0.73rem] font-black text-brand">
            {application.interviews.length}
          </span>
        </div>

        {application.interviews.length > 0 ? (
          <ul className="mb-[18px] grid list-none gap-2 p-0">
            {application.interviews.map((interview) => (
              <li
                className="flex items-center justify-between gap-[18px] border border-line bg-white px-3.5 py-[13px]"
                key={interview.id}
              >
                <strong className="text-[0.78rem]">
                  {interviewTypeLabels[interview.type]}
                </strong>
                <span className="text-[0.75rem] text-muted">
                  {formatDateTime(interview.scheduledAt)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-[18px] text-[0.75rem] text-muted">
            No interviews scheduled yet.
          </p>
        )}

        <form
          className="grid grid-cols-1 gap-3 min-[521px]:grid-cols-[0.8fr_1.2fr]"
          onSubmit={handleAddInterview}
        >
          <FormField label="Type">
            <Select
              className="h-[46px]"
              onChange={(event) =>
                setInterviewType(event.target.value as InterviewType)
              }
              value={interviewType}
            >
              {Object.entries(interviewTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Date and time">
            <Input
              className="h-[46px]"
              onChange={(event) => setScheduledAt(event.target.value)}
              required
              type="datetime-local"
              value={scheduledAt}
            />
          </FormField>
          <Button
            className="justify-self-end min-[521px]:col-span-2"
            disabled={interviewResult.loading}
            type="submit"
            variant="secondary"
          >
            {interviewResult.loading ? 'Adding…' : 'Add interview'}
          </Button>
        </form>
      </section>

      <section className="flex flex-col items-stretch justify-between gap-6 border-t border-line pt-7 min-[521px]:flex-row min-[521px]:items-center">
        <div>
          <h3 className="font-display text-[1.35rem] font-medium tracking-[-0.04em] text-ink">
            Delete application
          </h3>
          <p className="mt-1.5 mb-0 text-[0.75rem] text-muted">
            This also deletes every interview attached to it.
          </p>
        </div>
        {confirmDelete ? (
          <div className="flex justify-end gap-2">
            <Button
              disabled={deleteResult.loading}
              onClick={() => setConfirmDelete(false)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={deleteResult.loading}
              onClick={() => void handleDelete()}
              size="compact"
              variant="danger"
            >
              {deleteResult.loading ? 'Deleting…' : 'Confirm delete'}
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setConfirmDelete(true)}
            size="compact"
            variant="danger"
          >
            Delete
          </Button>
        )}
      </section>
    </div>
  )
}
