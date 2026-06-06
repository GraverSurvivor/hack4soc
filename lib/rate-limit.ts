const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

export function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetIn: WINDOW_MS };
  }

  if (entry.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetAt - now,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetIn: entry.resetAt - now,
  };
}
