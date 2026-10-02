import { useMutation } from '@apollo/client/react'
import { type FormEvent, useState } from 'react'

import { BrandMark } from '../ui/Brand'
import { Button } from '../ui/Button'
import { Alert, StatusDot } from '../ui/Feedback'
import { FormField, Input } from '../ui/FormField'
import { Eyebrow } from '../ui/Typography'
import { Turnstile } from '../security/Turnstile'
import { LOGIN_MUTATION, REGISTER_MUTATION } from './operations'
import { setAccessToken } from './token-storage'

type LoginPageProps = {
  onAuthenticated: () => void
}

export function LoginPage({ onAuthenticated }: LoginPageProps) {
  const isLocalDemo = import.meta.env.DEV
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState(
    isLocalDemo ? 'demo@example.com' : '',
  )
  const [password, setPassword] = useState(
    isLocalDemo ? 'portfolio-demo-password' : '',
  )
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [login, loginState] = useMutation(LOGIN_MUTATION)
  const [register, registerState] = useMutation(REGISTER_MUTATION)

  const isRegistering = mode === 'register'
  const loading = loginState.loading || registerState.loading
  const requestError = isRegistering
    ? registerState.error
    : loginState.error

  function changeMode(nextMode: 'login' | 'register') {
    setMode(nextMode)
    setFormError(null)
    loginState.reset()
    registerState.reset()
    setPasswordConfirmation('')
    setTurnstileToken(null)

    if (nextMode === 'login' && isLocalDemo) {
      setEmail('demo@example.com')
      setPassword('portfolio-demo-password')
      return
    }

    setEmail('')
    setPassword('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (isRegistering && password !== passwordConfirmation) {
      setFormError('Passwords do not match.')
      return
    }

    try {
      if (isRegistering) {
        const result = await register({
          variables: {
            input: {
              email,
              password,
              turnstileToken: turnstileToken ?? '',
            },
          },
        })

        if (result.data?.register.token) {
          setAccessToken(result.data.register.token)
          onAuthenticated()
        }
        return
      }

      const result = await login({ variables: { input: { email, password } } })

      if (result.data?.login.token) {
        setAccessToken(result.data.login.token)
        onAuthenticated()
      }
    } catch {
      // Apollo exposes the error through the mutation result rendered below.
      if (isRegistering) {
        setTurnstileResetSignal((signal) => signal + 1)
      }
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
        <BrandMark
          className="absolute top-[30px] left-8 min-[851px]:top-[42px] min-[851px]:left-[clamp(48px,8vw,120px)]"
          size="large"
        />
        <Eyebrow className="text-lime">Job application tracker</Eyebrow>
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
          <span
            aria-hidden="true"
            className="font-display text-[1.7rem] text-lime"
          >
            ↗
          </span>
          <div>
            <strong className="text-[0.95rem]">A portfolio application</strong>
            <p className="mt-[7px] mb-0 text-[0.88rem] leading-[1.55] text-[#eef4ed]/65">
              Built to demonstrate a production-style GraphQL workflow. Feel
              free to explore it and use it at your own discretion.
            </p>
          </div>
        </div>

        <footer className="mt-8 text-[0.72rem] font-bold tracking-[0.08em] text-[#eef4ed]/50 uppercase min-[851px]:absolute min-[851px]:bottom-[42px] min-[851px]:mt-0">
          Built by{' '}
          <a
            className="text-[#eef4ed]/75 underline decoration-[#eef4ed]/25 underline-offset-4 transition hover:text-lime hover:decoration-lime"
            href="https://github.com/justjuank/graphql-job-tracker"
            rel="noreferrer"
            target="_blank"
          >
            Juan Charria
          </a>
        </footer>
      </section>

      <section className="grid place-items-center bg-paper px-8 py-14 min-[851px]:p-12" aria-labelledby="auth-heading">
        <div className="w-full max-w-[430px]">
          <Eyebrow>{isRegistering ? 'Get started' : 'Welcome back'}</Eyebrow>
          <h2
            className="max-w-[360px] font-display text-[clamp(2.1rem,4vw,3.2rem)] leading-[1.02] font-medium tracking-[-0.04em] text-ink"
            id="auth-heading"
          >
            {isRegistering ? 'Create your account' : 'Sign in to your tracker'}
          </h2>
          <p className="mt-[18px] mb-[34px] leading-[1.55] text-muted">
            {isRegistering
              ? 'Use your email and a password with at least 10 characters.'
              : isLocalDemo
              ? 'The local demo credentials are filled in so you can explore immediately.'
              : 'Enter the credentials for your account.'}
          </p>

          <form onSubmit={handleSubmit} className="grid gap-5">
            <FormField
              className="text-[#36413b]"
              label="Email address"
              labelStyle="standard"
            >
              <Input
                className="h-[54px] rounded px-4"
                autoComplete="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </FormField>

            <FormField
              className="text-[#36413b]"
              label="Password"
              labelStyle="standard"
            >
              <Input
                className="h-[54px] rounded px-4"
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                minLength={10}
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </FormField>

            {isRegistering ? (
              <FormField
                className="text-[#36413b]"
                label="Confirm password"
                labelStyle="standard"
              >
                <Input
                  className="h-[54px] rounded px-4"
                  autoComplete="new-password"
                  minLength={10}
                  name="passwordConfirmation"
                  onChange={(event) =>
                    setPasswordConfirmation(event.target.value)
                  }
                  required
                  type="password"
                  value={passwordConfirmation}
                />
              </FormField>
            ) : null}

            {isRegistering ? (
              <Turnstile
                onToken={setTurnstileToken}
                resetSignal={turnstileResetSignal}
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              />
            ) : null}

            {formError || requestError ? (
              <Alert variant="error">
                {formError ?? requestError?.message}
              </Alert>
            ) : null}

            <Button
              className="w-full justify-between gap-5 rounded font-extrabold hover:not-disabled:-translate-y-px disabled:cursor-wait disabled:opacity-70"
              disabled={loading || (isRegistering && !turnstileToken)}
              size="tall"
              type="submit"
            >
              {loading
                ? isRegistering
                  ? 'Creating account…'
                  : 'Signing in…'
                : isRegistering
                  ? 'Create account'
                  : 'Sign in'}
              <span aria-hidden="true">→</span>
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-[#d6ddd7] pt-6 text-sm text-muted">
            <span>
              {isRegistering ? 'Already have an account?' : 'New here?'}
            </span>
            <Button
              onClick={() => changeMode(isRegistering ? 'login' : 'register')}
              size="compact"
              variant="secondary"
            >
              {isRegistering ? 'Sign in instead' : 'Create an account'}
            </Button>
          </div>

          <div className="mt-6 flex items-center gap-[9px] text-[0.78rem] text-muted">
            <StatusDot />
            {isLocalDemo
              ? 'Local demo account · API on port 4000'
              : 'Secure bearer-token authentication'}
          </div>
        </div>
      </section>
    </main>
  )
}
