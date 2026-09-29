import { useMutation, useQuery } from '@apollo/client/react'
import { type FormEvent, useState } from 'react'

import type {
  ApplicationDetailQuery,
  ApplicationStatus,
  DashboardQueryVariables,
  InterviewType,
} from '../gql/graphql'
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
    <div className="detail-backdrop" role="presentation">
      <section
        aria-labelledby="application-detail-heading"
        aria-modal="true"
        className="detail-panel"
        role="dialog"
      >
        <button
          aria-label="Close application details"
          className="detail-close-button"
          onClick={onClose}
          type="button"
        >
          ×
        </button>

        {loading ? (
          <div className="detail-state">
            <span className="loading-ring" aria-hidden="true" />
            <p>Loading application details…</p>
          </div>
        ) : null}

        {error ? (
          <div className="detail-state">
            <p className="eyebrow">Unable to load</p>
            <h2 id="application-detail-heading">Application unavailable</h2>
            <p>{error.message}</p>
          </div>
        ) : null}

        {!loading && !error && !data?.application ? (
          <div className="detail-state">
            <p className="eyebrow">Not found</p>
            <h2 id="application-detail-heading">Application unavailable</h2>
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
        className="detail-backdrop-dismiss"
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
    <div className="detail-content">
      <header className="detail-header">
        <p className="eyebrow">Application details</p>
        <h2 id="application-detail-heading">{application.role}</h2>
        <p>
          {application.company.name} · Added {formatDateTime(application.createdAt)}
        </p>
      </header>

      {notice ? (
        <div className="success-message" role="status">
          <span className="status-dot" aria-hidden="true" />
          {notice}
        </div>
      ) : null}

      {mutationError ? (
        <div className="form-error" role="alert">
          {mutationError.message}
        </div>
      ) : null}

      <form className="detail-form" onSubmit={handleUpdate}>
        <h3>Edit application</h3>
        <label>
          <span>Company</span>
          <input
            maxLength={120}
            onChange={(event) => setCompanyName(event.target.value)}
            required
            value={companyName}
          />
        </label>
        <label>
          <span>Role</span>
          <input
            maxLength={160}
            onChange={(event) => setRole(event.target.value)}
            required
            value={role}
          />
        </label>
        <label>
          <span>Status</span>
          <select
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
          className="filter-button"
          disabled={updateResult.loading}
          type="submit"
        >
          {updateResult.loading ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <section className="interview-section">
        <div className="detail-subheading">
          <h3>Interviews</h3>
          <span>{application.interviews.length}</span>
        </div>

        {application.interviews.length > 0 ? (
          <ul className="interview-list">
            {application.interviews.map((interview) => (
              <li key={interview.id}>
                <strong>{interviewTypeLabels[interview.type]}</strong>
                <span>{formatDateTime(interview.scheduledAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="detail-empty-copy">No interviews scheduled yet.</p>
        )}

        <form className="interview-form" onSubmit={handleAddInterview}>
          <label>
            <span>Type</span>
            <select
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
          <label>
            <span>Date and time</span>
            <input
              onChange={(event) => setScheduledAt(event.target.value)}
              required
              type="datetime-local"
              value={scheduledAt}
            />
          </label>
          <button
            className="clear-button"
            disabled={interviewResult.loading}
            type="submit"
          >
            {interviewResult.loading ? 'Adding…' : 'Add interview'}
          </button>
        </form>
      </section>

      <section className="danger-zone">
        <div>
          <h3>Delete application</h3>
          <p>This also deletes every interview attached to it.</p>
        </div>
        {confirmDelete ? (
          <div className="delete-confirmation">
            <button
              className="clear-button"
              disabled={deleteResult.loading}
              onClick={() => setConfirmDelete(false)}
              type="button"
            >
              Cancel
            </button>
            <button
              className="danger-button"
              disabled={deleteResult.loading}
              onClick={() => void handleDelete()}
              type="button"
            >
              {deleteResult.loading ? 'Deleting…' : 'Confirm delete'}
            </button>
          </div>
        ) : (
          <button
            className="danger-button"
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
