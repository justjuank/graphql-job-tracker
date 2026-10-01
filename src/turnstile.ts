export type TurnstileVerification = {
  verify(token: string, remoteIp: string): Promise<boolean>;
};

type SiteverifyResponse = {
  action?: string;
  hostname?: string;
  success: boolean;
};

export class TurnstileVerifier implements TurnstileVerification {
  constructor(
    private readonly secretKey: string,
    private readonly expectedHostname?: string,
    private readonly request: typeof fetch = fetch,
  ) {}

  async verify(token: string, remoteIp: string): Promise<boolean> {
    if (!token || token.length > 2_048) {
      return false;
    }

    try {
      const response = await this.request(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            remoteip: remoteIp,
            response: token,
            secret: this.secretKey,
          }),
          signal: AbortSignal.timeout(5_000),
        },
      );

      if (!response.ok) {
        return false;
      }

      const result = (await response.json()) as SiteverifyResponse;
      return (
        result.success &&
        result.action === "register" &&
        (!this.expectedHostname || result.hostname === this.expectedHostname)
      );
    } catch {
      return false;
    }
  }
}
