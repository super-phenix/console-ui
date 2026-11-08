const STORAGE_KEY = 'spx.redirectCount';
const EXCHANGE_KEY = 'spx.apiExchangeAttempt';

/** Full-page auth hops allowed before the chain is treated as a loop. */
export const MAX_REDIRECTS = 10;

function readCount(): number {
  try {
    const count = Number(sessionStorage.getItem(STORAGE_KEY));
    return Number.isInteger(count) && count > 0 ? count : 0;
  } catch {
    return 0;
  }
}

function writeCount(count: number): void {
  try {
    if (count <= 0) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, String(count));
    }
  } catch {
    // Storage can be blocked. The in-memory page still stops this hop.
  }
}

export const redirectLimit = {
  /**
   * Follow a full-page redirect.
   * Returns false once this tab has already redirected 10 times without reaching a settled page.
   */
  to(url: string): boolean {
    if (readCount() >= MAX_REDIRECTS) {
      return false;
    }
    writeCount(readCount() + 1);
    this.follow(url);
    return true;
  },

  /**
   * Follow one hop even when the cap is already spent.
   * A second call is refused until the chain settles.
   */
  once(url: string): boolean {
    try {
      if (sessionStorage.getItem(EXCHANGE_KEY) === '1') {
        return false;
      }
      sessionStorage.setItem(EXCHANGE_KEY, '1');
    } catch {
      // Storage can be blocked. This page load still navigates once.
    }
    writeCount(0);
    return this.to(url);
  },

  /** A rendered flow or an authenticated page ends the chain. */
  reset(): void {
    writeCount(0);
    try {
      sessionStorage.removeItem(EXCHANGE_KEY);
    } catch {
      // Storage can be blocked.
    }
  },

  follow(url: string): void {
    window.location.href = url;
  },
};
