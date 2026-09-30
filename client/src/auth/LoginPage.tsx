import { useMutation } from '@apollo/client/react'
import { type FormEvent, useState } from 'react'

import { graphql } from '../gql'
import {
  errorMessageClass,
  eyebrowClass,
  statusDotClass,
} from '../ui/styles'
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
    <main className="grid min-h-screen min-[851px]:grid-cols-[minmax(0,1.05fr)_minmax(440px,0.95fr)]">
      <section
        className="relative flex min-h-[52vh] flex-col justify-center overflow-hidden bg-brand px-8 pt-[110px] pb-12 text-[#eef4ed] min-[851px]:min-h-0 min-[851px]:p-[clamp(48px,8vw,120px)]"
        aria-labelledby="welcome-heading"
      >
        <div
          className="pointer-events-none absolute -top-[180px] -right-[280px] size-[520px] rounded-full border border-white/15 shadow-[0_0_0_70px_rgb(255_255_255_/_2.5%),0_0_0_140px_rgb(255_255_255_/_1.8%)]"
          aria-hidden="true"
        />
        <div className="absolute top-[30px] left-8 grid size-12 place-items-center rounded-[14px_4px_14px_4px] bg-lime text-[0.85rem] font-black tracking-[-0.04em] text-brand min-[851px]:top-[42px] min-[851px]:left-[clamp(48px,8vw,120px)]" aria-hidden="true">
          JT
        </div>
        <p className={`${eyebrowClass} text-lime`}>GraphQL portfolio project</p>
        <h1
          className="relative max-w-[680px] font-display text-[3.2rem] leading-[0.92] font-medium tracking-[-0.045em] min-[521px]:text-[clamp(3.5rem,7vw,6.8rem)]"
          id="welcome-heading"
        >
          Keep the search moving.
        </h1>
        <p className="my-[30px] max-w-[520px] text-[1.12rem] leading-[1.65] text-[#eef4ed]/70 min-[851px]:mb-12">
          Track every opportunity, interview, and decision from one focused
          workspace.
        </p>

        <div className="grid max-w-[570px] grid-cols-1 gap-5 border border-white/15 bg-white/5 p-[22px] backdrop-blur-md min-[521px]:grid-cols-[auto_1fr]">
          <span className="font-display text-[1.7rem] text-lime">01</span>
          <div>
            <strong className="text-[0.95rem]">Apollo Client foundation</strong>
            <p className="mt-[7px] mb-0 text-[0.88rem] leading-[1.55] text-[#eef4ed]/65">
              This login mutation sends credentials to the GraphQL API and
              stores the returned access token for later operations.
            </p>
          </div>
        </div>

        <p className="absolute bottom-[42px] hidden text-[0.72rem] font-bold tracking-[0.11em] text-[#eef4ed]/45 uppercase min-[851px]:block">
          React · Apollo Client · TypeScript
        </p>
      </section>

      <section className="grid place-items-center bg-paper px-8 py-14 min-[851px]:p-12" aria-labelledby="sign-in-heading">
        <div className="w-full max-w-[430px]">
          <p className={eyebrowClass}>Welcome back</p>
          <h2
            className="max-w-[360px] font-display text-[clamp(2.1rem,4vw,3.2rem)] leading-[1.02] font-medium tracking-[-0.04em] text-ink"
            id="sign-in-heading"
          >
            Sign in to your tracker
          </h2>
          <p className="mt-[18px] mb-[34px] leading-[1.55] text-muted">
            The demo credentials are filled in so you can explore immediately.
          </p>

          <form onSubmit={handleSubmit} className="grid gap-5">
            <label className="grid gap-2 text-[0.8rem] font-bold text-[#36413b]">
              <span>Email address</span>
              <input
                className="h-[54px] w-full rounded border border-[#cbcfc9] bg-white px-4 text-ink outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/10"
                autoComplete="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>

            <label className="grid gap-2 text-[0.8rem] font-bold text-[#36413b]">
              <span>Password</span>
              <input
                className="h-[54px] w-full rounded border border-[#cbcfc9] bg-white px-4 text-ink outline-none transition focus:border-brand focus:ring-3 focus:ring-brand/10"
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
              <div className={errorMessageClass} role="alert">
                {error.message}
              </div>
            ) : null}

            <button
              className="flex min-h-[54px] items-center justify-between gap-5 rounded bg-brand px-5 font-extrabold text-white transition hover:not-disabled:-translate-y-px hover:not-disabled:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Signing in…' : 'Sign in'}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <div className="mt-6 flex items-center gap-[9px] text-[0.78rem] text-muted">
            <span className={statusDotClass} aria-hidden="true" />
            Local demo account · API on port 4000
          </div>
        </div>
      </section>
    </main>
  )
}
