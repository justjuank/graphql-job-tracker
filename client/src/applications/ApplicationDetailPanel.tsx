import { useMutation, useQuery } from '@apollo/client/react'
import { type FormEvent, useState } from 'react'

import type {
  ApplicationDetailQuery,
  ApplicationStatus,
  DashboardQueryVariables,
  InterviewType,
} from '../gql/graphql'
import {
  errorMessageClass,
  eyebrowClass,
  fieldClass,
  fieldLabelClass,
  panelHeadingClass,
  primaryButtonClass,
  secondaryButtonClass,
  statusDotClass,
  successMessageClass,
} from '../ui/styles'
import { statusLabels } from './application-status'
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
        <button
          aria-label="Close application details"
          className="absolute top-5 right-[22px] grid size-[38px] place-items-center rounded-full border border-line bg-transparent p-0 text-[1.35rem] text-muted"
          onClick={onClose}
          type="button"
        >
          ×
        </button>

        {loading ? (
          <div className="grid min-h-[70vh] place-content-center justify-items-center gap-[15px] text-center">
            <span
              className="size-9 animate-spin rounded-full border-[3px] border-[#ccd2ca] border-t-brand"
              aria-hidden="true"
            />
            <p>Loading application details…</p>
          </div>
        ) : null}

        {error ? (
          <div className="grid min-h-[70vh] place-content-center justify-items-center gap-[15px] text-center">
            <p className={eyebrowClass}>Unable to load</p>
            <h2
              className={`${panelHeadingClass} text-[clamp(2.2rem,5vw,3.6rem)]`}
              id="application-detail-heading"
            >
              Application unavailable
            </h2>
            <p className="leading-[1.55] text-muted">{error.message}</p>
          </div>
        ) : null}

        {!loading && !error && !data?.application ? (
          <div className="grid min-h-[70vh] place-content-center justify-items-center gap-[15px] text-center">
            <p className={eyebrowClass}>Not found</p>
            <h2
              className={`${panelHeadingClass} text-[clamp(2.2rem,5vw,3.6rem)]`}
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
        <p className={eyebrowClass}>Application details</p>
        <h2
          className={`${panelHeadingClass} text-[clamp(2.2rem,5vw,3.6rem)]`}
          id="application-detail-heading"
        >
          {application.role}
        </h2>
        <p className="mt-3 mb-0 text-[0.84rem] leading-[1.55] text-muted">
          {application.company.name} · Added {formatDateTime(application.createdAt)}
        </p>
      </header>

      {notice ? (
        <div className={successMessageClass} role="status">
          <span className={statusDotClass} aria-hidden="true" />
          {notice}
        </div>
      ) : null}

      {mutationError ? (
        <div className={errorMessageClass} role="alert">
          {mutationError.message}
        </div>
      ) : null}

      <form
        className="grid grid-cols-1 gap-4 border-t border-line pt-7 min-[521px]:grid-cols-2"
        onSubmit={handleUpdate}
      >
        <h3 className={`${panelHeadingClass} text-[1.35rem] min-[521px]:col-span-2`}>
          Edit application
        </h3>
        <label className={fieldLabelClass}>
          <span>Company</span>
          <input
            className={`${fieldClass} h-[46px]`}
            maxLength={120}
            onChange={(event) => setCompanyName(event.target.value)}
            required
            value={companyName}
          />
        </label>
        <label className={fieldLabelClass}>
          <span>Role</span>
          <input
            className={`${fieldClass} h-[46px]`}
            maxLength={160}
            onChange={(event) => setRole(event.target.value)}
            required
            value={role}
          />
        </label>
        <label className={fieldLabelClass}>
          <span>Status</span>
          <select
            className={`${fieldClass} h-[46px]`}
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
          </select>
        </label>
        <button
          className={`${primaryButtonClass} justify-self-end min-[521px]:col-span-2`}
          disabled={updateResult.loading}
          type="submit"
        >
          {updateResult.loading ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <section className="border-t border-line pt-7">
        <div className="mb-4 flex items-center justify-between">
          <h3 className={`${panelHeadingClass} text-[1.35rem]`}>Interviews</h3>
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
          <label className={fieldLabelClass}>
            <span>Type</span>
            <select
              className={`${fieldClass} h-[46px]`}
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
            </select>
          </label>
          <label className={fieldLabelClass}>
            <span>Date and time</span>
            <input
              className={`${fieldClass} h-[46px]`}
              onChange={(event) => setScheduledAt(event.target.value)}
              required
              type="datetime-local"
              value={scheduledAt}
            />
          </label>
          <button
            className={`${secondaryButtonClass} justify-self-end min-[521px]:col-span-2`}
            disabled={interviewResult.loading}
            type="submit"
          >
            {interviewResult.loading ? 'Adding…' : 'Add interview'}
          </button>
        </form>
      </section>

      <section className="flex flex-col items-stretch justify-between gap-6 border-t border-line pt-7 min-[521px]:flex-row min-[521px]:items-center">
        <div>
          <h3 className={`${panelHeadingClass} text-[1.35rem]`}>
            Delete application
          </h3>
          <p className="mt-1.5 mb-0 text-[0.75rem] text-muted">
            This also deletes every interview attached to it.
          </p>
        </div>
        {confirmDelete ? (
          <div className="flex justify-end gap-2">
            <button
              className={secondaryButtonClass}
              disabled={deleteResult.loading}
              onClick={() => setConfirmDelete(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="min-h-[42px] rounded-[3px] border border-[#a64032] bg-[#a64032] px-[15px] font-extrabold text-white disabled:cursor-wait disabled:opacity-55"
              disabled={deleteResult.loading}
              onClick={() => void handleDelete()}
              type="button"
            >
              {deleteResult.loading ? 'Deleting…' : 'Confirm delete'}
            </button>
          </div>
        ) : (
          <button
            className="min-h-[42px] rounded-[3px] border border-[#a64032] bg-[#a64032] px-[15px] font-extrabold text-white disabled:cursor-wait disabled:opacity-55"
            onClick={() => setConfirmDelete(true)}
            type="button"
          >
            Delete
          </button>
        )}
      </section>
    </div>
  )
}
