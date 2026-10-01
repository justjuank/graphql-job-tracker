import { useEffect, useRef } from 'react'

type TurnstileApi = {
  remove(widgetId: string): void
  render(
    container: HTMLElement,
    options: {
      action: string
      callback(token: string): void
      'error-callback'(): void
      'expired-callback'(): void
      sitekey: string
      theme: 'light'
    },
  ): string
  reset(widgetId: string): void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile)
  }

  if (scriptPromise) {
    return scriptPromise
  }

  const pendingScript = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.turnstile) {
        resolve(window.turnstile)
      } else {
        reject(new Error('Turnstile did not initialize.'))
      }
    }
    script.onerror = () => reject(new Error('Turnstile failed to load.'))
    document.head.append(script)
  })
  scriptPromise = pendingScript
  void pendingScript.catch(() => {
    if (scriptPromise === pendingScript) {
      scriptPromise = null
    }
  })

  return pendingScript
}

type TurnstileProps = {
  onToken: (token: string | null) => void
  resetSignal: number
  siteKey: string
}

export function Turnstile({ onToken, resetSignal, siteKey }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onTokenRef = useRef(onToken)
  const widgetIdRef = useRef<string | null>(null)

  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    let active = true

    void loadTurnstile()
      .then((turnstile) => {
        if (!active || !containerRef.current) {
          return
        }

        widgetIdRef.current = turnstile.render(containerRef.current, {
          action: 'register',
          callback: (token) => onTokenRef.current(token),
          'error-callback': () => onTokenRef.current(null),
          'expired-callback': () => onTokenRef.current(null),
          sitekey: siteKey,
          theme: 'light',
        })
      })
      .catch(() => {
        if (active) {
          onTokenRef.current(null)
        }
      })

    return () => {
      active = false
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey])

  useEffect(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
      onTokenRef.current(null)
    }
  }, [resetSignal])

  return <div ref={containerRef} aria-label="Human verification" />
}
