import { useMutation } from '@apollo/client/react'
import { type FormEvent, useState } from 'react'

import type { ApplicationStatus } from '../gql/graphql'
import { statusLabels } from './application-status'
import { CREATE_APPLICATION_MUTATION, DASHBOARD_QUERY } from './operations'

type CreateApplicationFormProps = {
  onCancel: () => void
  onCreated: (role: string) => void
}

export function CreateApplicationForm({
  onCancel,
  onCreated,
}: CreateApplicationFormProps) {
  const [companyName, setCompanyName] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState<ApplicationStatus>('SAVED')
  const [createApplication, { loading, error }] = useMutation(
    CREATE_APPLICATION_MUTATION,
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const result = await createApplication({
        variables: {
          input: {
            companyName: companyName.trim(),
            role: role.trim(),
            status,
          },
        },
        refetchQueries: [DASHBOARD_QUERY],
        awaitRefetchQueries: true,
      })

      if (result.data) {
        onCreated(result.data.createApplication.role)
      }
    } catch {
      // Apollo exposes the mutation error in the result rendered below.
    }
  }

  return (
    <form className="create-application-form" onSubmit={handleSubmit}>
      <div className="create-form-heading">
        <div>
          <p className="eyebrow">New opportunity</p>
          <h3>Add an application</h3>
        </div>
        <button
          aria-label="Close new application form"
          className="close-button"
          disabled={loading}
          onClick={onCancel}
          type="button"
        >
          ×
        </button>
      </div>

      <div className="create-form-fields">
        <label>
          <span>Company</span>
          <input
            autoFocus
            maxLength={120}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Acme"
            required
            value={companyName}
          />
        </label>
        <label>
          <span>Role</span>
          <input
            maxLength={160}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Backend Engineer"
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
      </div>

      {error ? (
        <div className="form-error" role="alert">
          {error.message}
        </div>
      ) : null}

      <div className="create-form-actions">
        <button
          className="clear-button"
          disabled={loading}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button className="filter-button" disabled={loading} type="submit">
          {loading ? 'Adding…' : 'Add application'}
        </button>
      </div>
    </form>
  )
}
