import { MockedProvider } from '@apollo/client/testing/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { getAccessToken } from './token-storage'
import { LoginPage } from './LoginPage'
import { LOGIN_MUTATION } from './operations'

const credentials = {
  email: 'demo@example.com',
  password: 'portfolio-demo-password',
}

describe('LoginPage', () => {
  it('stores the returned token and authenticates the user', async () => {
    const onAuthenticated = vi.fn()
    const user = userEvent.setup()

    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: LOGIN_MUTATION,
              variables: { input: credentials },
            },
            result: {
              data: {
                login: {
                  __typename: 'AuthPayload',
                  token: 'test-access-token',
                  user: {
                    __typename: 'User',
                    id: 'user-1',
                    email: credentials.email,
                    role: 'ADMIN',
                  },
                },
              },
            },
          },
        ]}
      >
        <LoginPage onAuthenticated={onAuthenticated} />
      </MockedProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledOnce())
    expect(getAccessToken()).toBe('test-access-token')
  })

  it('renders a GraphQL network error without authenticating', async () => {
    const onAuthenticated = vi.fn()
    const user = userEvent.setup()

    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: LOGIN_MUTATION,
              variables: { input: credentials },
            },
            error: new Error('Invalid email or password.'),
          },
        ]}
      >
        <LoginPage onAuthenticated={onAuthenticated} />
      </MockedProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password.',
    )
    expect(onAuthenticated).not.toHaveBeenCalled()
    expect(getAccessToken()).toBeNull()
  })
})
