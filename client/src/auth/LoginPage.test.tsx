import { MockedProvider } from '@apollo/client/testing/react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { getAccessToken } from './token-storage'
import { LoginPage } from './LoginPage'
import { LOGIN_MUTATION, REGISTER_MUTATION } from './operations'

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

  it('creates an account, stores the token, and authenticates the user', async () => {
    const onAuthenticated = vi.fn()
    const user = userEvent.setup()
    const registration = {
      email: 'new.user@example.com',
      password: 'a-secure-new-password',
    }

    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: REGISTER_MUTATION,
              variables: { input: registration },
            },
            result: {
              data: {
                register: {
                  __typename: 'AuthPayload',
                  token: 'new-user-access-token',
                  user: {
                    __typename: 'User',
                    id: 'user-2',
                    email: registration.email,
                    role: 'USER',
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

    await user.click(screen.getByRole('button', { name: 'Create an account' }))
    await user.type(screen.getByRole('textbox', { name: 'Email address' }), registration.email)
    await user.type(screen.getByLabelText('Password'), registration.password)
    await user.type(screen.getByLabelText('Confirm password'), registration.password)
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledOnce())
    expect(getAccessToken()).toBe('new-user-access-token')
  })

  it('rejects mismatched registration passwords before sending a mutation', async () => {
    const onAuthenticated = vi.fn()
    const user = userEvent.setup()

    render(
      <MockedProvider>
        <LoginPage onAuthenticated={onAuthenticated} />
      </MockedProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Create an account' }))
    await user.type(screen.getByRole('textbox', { name: 'Email address' }), 'new@example.com')
    await user.type(screen.getByLabelText('Password'), 'a-secure-password')
    await user.type(screen.getByLabelText('Confirm password'), 'a-different-password')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Passwords do not match.',
    )
    expect(onAuthenticated).not.toHaveBeenCalled()
    expect(getAccessToken()).toBeNull()
  })
})
