import { useMutation } from '@apollo/client/react'
import { type FormEvent, useState } from 'react'

import type { ApplicationStatus } from '../gql/graphql'
import {
  errorMessageClass,
  eyebrowClass,
  fieldClass,
  fieldLabelClass,
} from '../ui/styles'
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
    <form
      className="mb-4 grid gap-[22px] bg-brand p-[26px] text-[#edf4ee]"
      onSubmit={handleSubmit}
    >
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className={`${eyebrowClass} mb-[7px] text-lime`}>
            New opportunity
          </p>
          <h3 className="font-display text-[1.8rem] font-medium">
            Add an application
          </h3>
        </div>
        <button
          aria-label="Close new application form"
          className="grid size-9 place-items-center rounded-full border border-white/20 bg-transparent p-0 text-[1.35rem] text-white/70"
          disabled={loading}
          onClick={onCancel}
          type="button"
        >
          ×
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 min-[521px]:grid-cols-2 min-[851px]:grid-cols-[1fr_1fr_0.7fr]">
        <label className={`${fieldLabelClass} text-[#edf4ee]/65`}>
          <span>Company</span>
          <input
            className={`${fieldClass} h-12 focus:border-lime focus:ring-lime/15`}
            autoFocus
            maxLength={120}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Acme"
            required
            value={companyName}
          />
        </label>
        <label className={`${fieldLabelClass} text-[#edf4ee]/65`}>
          <span>Role</span>
          <input
            className={`${fieldClass} h-12 focus:border-lime focus:ring-lime/15`}
            maxLength={160}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Backend Engineer"
            required
            value={role}
          />
        </label>
        <label className={`${fieldLabelClass} text-[#edf4ee]/65`}>
          <span>Status</span>
          <select
            className={`${fieldClass} h-12 focus:border-lime focus:ring-lime/15`}
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
        <div
          className={`${errorMessageClass} border-[#ff896c] bg-[#831f13]/35 text-[#ffdcd4]`}
          role="alert"
        >
          {error.message}
        </div>
      ) : null}

      <div className="flex justify-end gap-2.5">
        <button
          className="h-11 rounded-[3px] border border-white/25 bg-transparent px-4 font-bold text-white/80 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={loading}
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
        <button
          className="h-11 rounded-[3px] border border-lime bg-lime px-4 font-bold text-brand disabled:cursor-not-allowed disabled:opacity-45"
          disabled={loading}
          type="submit"
        >
          {loading ? 'Adding…' : 'Add application'}
        </button>
      </div>
    </form>
  )
}
