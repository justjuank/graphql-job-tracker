import { MockedProvider } from '@apollo/client/testing/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ApplicationDetailPanel } from './ApplicationDetailPanel'
import {
  APPLICATION_DETAIL_QUERY,
  UPDATE_APPLICATION_MUTATION,
} from './operations'

const application = {
  __typename: 'JobApplication' as const,
  id: 'application-2',
  role: 'Platform Engineer',
  jobPostingUrl: 'https://globex.example/jobs/platform-engineer',
  status: 'INTERVIEWING' as const,
  createdAt: '2026-09-22T16:30:00.000Z',
  company: {
    __typename: 'Company' as const,
    id: 'company-2',
    name: 'Globex',
  },
  interviews: [
    {
      __typename: 'Interview' as const,
      id: 'interview-1',
      type: 'TECHNICAL' as const,
      scheduledAt: '2026-09-28T15:00:00.000Z',
    },
  ],
}

describe('ApplicationDetailPanel', () => {
  it('loads details, updates the application, and handles delete confirmation', async () => {
    const user = userEvent.setup()

    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: APPLICATION_DETAIL_QUERY,
              variables: { id: application.id },
            },
            result: { data: { application } },
          },
          {
            request: {
              query: UPDATE_APPLICATION_MUTATION,
              variables: {
                id: application.id,
                input: {
                  companyName: 'Globex',
                  role: 'Senior Platform Engineer',
                  jobPostingUrl: application.jobPostingUrl,
                  status: 'INTERVIEWING',
                },
              },
            },
            result: {
              data: {
                updateApplication: {
                  __typename: 'UpdateApplicationPayload',
                  application: {
                    __typename: 'JobApplication',
                    id: application.id,
                    role: 'Senior Platform Engineer',
                    jobPostingUrl: application.jobPostingUrl,
                    status: 'INTERVIEWING',
                    company: application.company,
                  },
                },
              },
            },
          },
        ]}
      >
        <ApplicationDetailPanel
          applicationId={application.id}
          dashboardVariables={{ first: 5, after: null, filter: null }}
          onClose={vi.fn()}
          onDeleted={vi.fn()}
        />
      </MockedProvider>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Platform Engineer' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toHaveTextContent('Technical')
    expect(
      screen.getByRole('link', { name: 'View job posting ↗' }),
    ).toHaveAttribute('href', application.jobPostingUrl)
    expect(screen.getByText('Interviewing', { selector: 'span' })).toBeInTheDocument()

    const roleInput = screen.getByRole('textbox', { name: 'Role' })
    await user.clear(roleInput)
    await user.type(roleInput, 'Senior Platform Engineer')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Application details updated.',
    )

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(
      screen.getByRole('button', { name: 'Confirm delete' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(
      screen.queryByRole('button', { name: 'Confirm delete' }),
    ).not.toBeInTheDocument()
  })
})
