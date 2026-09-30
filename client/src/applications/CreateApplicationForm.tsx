import { useMutation } from '@apollo/client/react'
import { type FormEvent, useState } from 'react'

import type { ApplicationStatus } from '../gql/graphql'
import { Button } from '../ui/Button'
import { Alert } from '../ui/Feedback'
import { FormField, Input, Select } from '../ui/FormField'
import { Eyebrow } from '../ui/Typography'
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
          <Eyebrow className="mb-[7px] text-lime">New opportunity</Eyebrow>
          <h3 className="font-display text-[1.8rem] font-medium">
            Add an application
          </h3>
        </div>
        <Button
          aria-label="Close new application form"
          className="size-9 rounded-full border-white/20 text-[1.35rem] text-white/70"
          disabled={loading}
          onClick={onCancel}
          size="icon"
          variant="ghost"
        >
          ×
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 min-[521px]:grid-cols-2 min-[851px]:grid-cols-[1fr_1fr_0.7fr]">
        <FormField label="Company" tone="dark">
          <Input
            className="h-12 focus:border-lime focus:ring-lime/15"
            autoFocus
            maxLength={120}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Acme"
            required
            value={companyName}
          />
        </FormField>
        <FormField label="Role" tone="dark">
          <Input
            className="h-12 focus:border-lime focus:ring-lime/15"
            maxLength={160}
            onChange={(event) => setRole(event.target.value)}
            placeholder="Backend Engineer"
            required
            value={role}
          />
        </FormField>
        <FormField label="Status" tone="dark">
          <Select
            className="h-12 focus:border-lime focus:ring-lime/15"
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
      </div>

      {error ? (
        <Alert
          className="border-[#ff896c] bg-[#831f13]/35 text-[#ffdcd4]"
          variant="error"
        >
          {error.message}
        </Alert>
      ) : null}

      <div className="flex justify-end gap-2.5">
        <Button
          disabled={loading}
          onClick={onCancel}
          variant="ghost"
        >
          Cancel
        </Button>
        <Button
          disabled={loading}
          type="submit"
          variant="lime"
        >
          {loading ? 'Adding…' : 'Add application'}
        </Button>
      </div>
    </form>
  )
}
