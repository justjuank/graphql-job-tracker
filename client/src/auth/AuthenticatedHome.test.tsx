import { MockedProvider } from '@apollo/client/testing/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DASHBOARD_QUERY } from '../applications/operations'
import { AuthenticatedHome } from './AuthenticatedHome'

const backendApplication = {
  __typename: 'JobApplication' as const,
  id: 'application-1',
  role: 'Backend Engineer',
  jobPostingUrl: 'https://acme.example/jobs/backend-engineer',
  status: 'APPLIED' as const,
  createdAt: '2026-09-20T15:00:00.000Z',
  company: {
    __typename: 'Company' as const,
    id: 'company-1',
    name: 'Acme',
  },
}

const platformApplication = {
  __typename: 'JobApplication' as const,
  id: 'application-2',
  role: 'Platform Engineer',
  jobPostingUrl: null,
  status: 'INTERVIEWING' as const,
  createdAt: '2026-09-22T16:30:00.000Z',
  company: {
    __typename: 'Company' as const,
    id: 'company-2',
    name: 'Globex',
  },
}

function dashboardData(applications = [backendApplication, platformApplication]) {
  return {
    me: {
      __typename: 'User' as const,
      id: 'user-1',
      email: 'demo@example.com',
      role: 'ADMIN' as const,
      applications: applications.map(({ id, status }) => ({
        __typename: 'JobApplication' as const,
        id,
        status,
      })),
    },
    applicationPage: {
      __typename: 'ApplicationConnection' as const,
      edges: applications.map((application, index) => ({
        __typename: 'ApplicationEdge' as const,
        cursor: `cursor-${index + 1}`,
        node: application,
      })),
      pageInfo: {
        __typename: 'PageInfo' as const,
        hasNextPage: false,
        endCursor: null,
      },
    },
  }
}

describe('AuthenticatedHome', () => {
  it('renders summary data and applies a status filter', async () => {
    const user = userEvent.setup()

    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: DASHBOARD_QUERY,
              variables: { first: 5, after: null, filter: null },
            },
            result: { data: dashboardData() },
          },
          {
            request: {
              query: DASHBOARD_QUERY,
              variables: {
                first: 5,
                after: null,
                filter: { status: 'INTERVIEWING' },
              },
            },
            result: { data: dashboardData([platformApplication]) },
          },
        ]}
      >
        <AuthenticatedHome onLogout={vi.fn()} />
      </MockedProvider>,
    )

    expect(await screen.findByText('Backend Engineer')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View posting ↗' })).toHaveAttribute(
      'href',
      backendApplication.jobPostingUrl,
    )
    expect(screen.getByText('Platform Engineer')).toBeInTheDocument()
    expect(
      screen.getByText('Total applications').closest('article'),
    ).toHaveTextContent('2')

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Status' }),
      'INTERVIEWING',
    )
    await user.click(screen.getByRole('button', { name: 'Apply filters' }))

    await waitFor(() => {
      expect(screen.getByText('Platform Engineer')).toBeInTheDocument()
      expect(screen.queryByText('Backend Engineer')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
  })
})
