import type { FormEvent } from 'react'

import { statusLabels } from '../applications/application-status'
import type { ApplicationStatus } from '../gql/graphql'
import { Button } from '../ui/Button'
import { FormField, Input, Select } from '../ui/FormField'

type ApplicationFiltersProps = {
  company: string
  filtersActive: boolean
  loading: boolean
  onClear: () => void
  onCompanyChange: (company: string) => void
  onRoleChange: (role: string) => void
  onStatusChange: (status: ApplicationStatus | '') => void
  onSubmit: () => void
  role: string
  status: ApplicationStatus | ''
}

export function ApplicationFilters({
  company,
  filtersActive,
  loading,
  onClear,
  onCompanyChange,
  onRoleChange,
  onStatusChange,
  onSubmit,
  role,
  status,
}: ApplicationFiltersProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form
      className="grid grid-cols-1 items-end gap-3 border border-line bg-paper p-5 min-[521px]:grid-cols-2 min-[851px]:grid-cols-[0.8fr_1fr_1fr_auto_auto]"
      onSubmit={handleSubmit}
    >
      <FormField label="Status">
        <Select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as ApplicationStatus | '')
          }
        >
          <option value="">All statuses</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormField label="Company">
        <Input
          value={company}
          onChange={(event) => onCompanyChange(event.target.value)}
          placeholder="Search company"
        />
      </FormField>
      <FormField label="Role">
        <Input
          value={role}
          onChange={(event) => onRoleChange(event.target.value)}
          placeholder="Search role"
        />
      </FormField>
      <Button disabled={loading} type="submit">
        Apply filters
      </Button>
      {filtersActive ? (
        <Button variant="secondary" onClick={onClear}>
          Clear
        </Button>
      ) : null}
    </form>
  )
}
