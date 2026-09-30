import { useMutation } from '@apollo/client/react'

import type { ApplicationStatus } from '../gql/graphql'
import { statusClasses, statusLabels } from './application-status'
import {
  DASHBOARD_QUERY,
  UPDATE_APPLICATION_STATUS_MUTATION,
} from './operations'

type ApplicationStatusSelectProps = {
  activeStatusFilter: ApplicationStatus | null
  applicationId: string
  applicationRole: string
  status: ApplicationStatus
}

export function ApplicationStatusSelect({
  activeStatusFilter,
  applicationId,
  applicationRole,
  status,
}: ApplicationStatusSelectProps) {
  const [updateStatus, { loading, error }] = useMutation(
    UPDATE_APPLICATION_STATUS_MUTATION,
  )

  async function handleChange(nextStatus: ApplicationStatus) {
    if (nextStatus === status) return

    const leavesActiveFilter =
      activeStatusFilter !== null && activeStatusFilter !== nextStatus

    try {
      await updateStatus({
        variables: { id: applicationId, status: nextStatus },
        optimisticResponse: {
          updateApplicationStatus: {
            __typename: 'JobApplication',
            id: applicationId,
            status: nextStatus,
          },
        },
        // Apollo's normalized cache updates the entity and summary counts.
        // A filtered connection needs a refetch when membership changes.
        refetchQueries: leavesActiveFilter ? [DASHBOARD_QUERY] : [],
        awaitRefetchQueries: leavesActiveFilter,
      })
    } catch {
      // Apollo rolls back the optimistic response and exposes the error below.
    }
  }

  return (
    <div className="col-start-2 grid justify-items-start gap-[5px] min-[521px]:col-auto min-[521px]:justify-items-end">
      <select
        aria-label={`Status for ${applicationRole}`}
        className={`max-w-[150px] justify-self-start rounded-full border-0 px-2.5 py-[7px] text-[0.67rem] font-black tracking-[0.04em] uppercase outline-none focus:ring-3 focus:ring-brand/15 disabled:cursor-wait disabled:opacity-60 min-[521px]:justify-self-end ${statusClasses[status]}`}
        disabled={loading}
        onChange={(event) =>
          void handleChange(event.target.value as ApplicationStatus)
        }
        value={status}
      >
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      {error ? (
        <span
          className="text-[0.68rem] font-bold text-[#a33b2d]"
          role="alert"
          title={error.message}
        >
          Update failed
        </span>
      ) : null}
    </div>
  )
}
