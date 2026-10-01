import { MockedProvider } from '@apollo/client/testing/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ApplicationStatusSelect } from './ApplicationStatusSelect'
import { UPDATE_APPLICATION_STATUS_MUTATION } from './operations'

describe('ApplicationStatusSelect', () => {
  it('sends the selected status and re-enables the control', async () => {
    const user = userEvent.setup()
    const mutationResult = vi.fn(() => ({
      data: {
        updateApplicationStatus: {
          __typename: 'JobApplication' as const,
          id: 'application-1',
          status: 'INTERVIEWING' as const,
        },
      },
    }))

    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: UPDATE_APPLICATION_STATUS_MUTATION,
              variables: {
                id: 'application-1',
                status: 'INTERVIEWING',
              },
            },
            result: mutationResult,
          },
        ]}
      >
        <ApplicationStatusSelect
          activeStatusFilter={null}
          applicationId="application-1"
          applicationRole="Backend Engineer"
          status="APPLIED"
        />
      </MockedProvider>,
    )

    const select = screen.getByRole('combobox', {
      name: 'Status for Backend Engineer',
    })
    await user.selectOptions(select, 'INTERVIEWING')

    await waitFor(() => expect(mutationResult).toHaveBeenCalledOnce())
    expect(mutationResult).toHaveBeenCalledWith({
      id: 'application-1',
      status: 'INTERVIEWING',
    })
    await waitFor(() => expect(select).not.toBeDisabled())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
