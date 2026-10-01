type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export class RegistrationRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  constructor(
    private readonly maximumAttempts = 5,
    private readonly windowMilliseconds = 60 * 60 * 1_000,
  ) {}

  consume(key: string, now = Date.now()): number | null {
    const entry = this.entries.get(key);

    if (!entry || entry.resetAt <= now) {
      this.entries.set(key, {
        count: 1,
        resetAt: now + this.windowMilliseconds,
      });
      return null;
    }

    if (entry.count >= this.maximumAttempts) {
      return Math.max(1, Math.ceil((entry.resetAt - now) / 1_000));
    }

    entry.count += 1;
    return null;
  }

  clear() {
    this.entries.clear();
  }
}
