import { useMutation } from '@apollo/client/react'
import { type FormEvent, useState } from 'react'

import { graphql } from '../gql'
import { setAccessToken } from './token-storage'

const LOGIN_MUTATION = graphql(`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        role
      }
    }
  }
`)

type LoginPageProps = {
  onAuthenticated: () => void
}

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const [email, setEmail] = useState('demo@example.com')
  const [password, setPassword] = useState('portfolio-demo-password')
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      const result = await login({
        variables: {
          input: { email, password },
        },
      })

      if (result.data?.login.token) {
        setAccessToken(result.data.login.token)
        onAuthenticated()
      }
    } catch {
      // Apollo exposes the error through the mutation result rendered below.
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-story" aria-labelledby="welcome-heading">
        <div className="brand-mark" aria-hidden="true">
          JT
        </div>
        <p className="eyebrow">GraphQL portfolio project</p>
        <h1 id="welcome-heading">Keep the search moving.</h1>
        <p className="auth-intro">
          Track every opportunity, interview, and decision from one focused
          workspace.
        </p>

        <div className="learning-card">
          <span className="learning-number">01</span>
          <div>
            <strong>Apollo Client foundation</strong>
            <p>
              This login mutation sends credentials to the GraphQL API and
              stores the returned access token for later operations.
            </p>
          </div>
        </div>

        <p className="stack-note">React · Apollo Client · TypeScript</p>
      </section>

      <section className="auth-panel" aria-labelledby="sign-in-heading">
        <div className="auth-panel-inner">
          <p className="eyebrow">Welcome back</p>
          <h2 id="sign-in-heading">Sign in to your tracker</h2>
          <p className="panel-copy">
            The demo credentials are filled in so you can explore immediately.
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <label>
              <span>Email address</span>
              <input
                autoComplete="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>

            <label>
              <span>Password</span>
              <input
                autoComplete="current-password"
                minLength={10}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </label>

            {error ? (
              <div className="form-error" role="alert">
                {error.message}
              </div>
            ) : null}

            <button className="primary-button" disabled={loading} type="submit">
              {loading ? 'Signing in…' : 'Sign in'}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="demo-hint">
            <span className="status-dot" aria-hidden="true" />
            Local demo account · API on port 4000
          </div>
        </div>
      </section>
    </main>
  )
}
