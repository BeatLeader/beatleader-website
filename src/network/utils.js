export const parseRateLimitHeaders = response => {
  if (!response || !response.headers) return null;

  const remaining = parseInt(response.headers.get('x-ratelimit-remaining'), 10);
  const limit = parseInt(response.headers.get('x-ratelimit-limit'), 10);
  const resetAt = parseInt(response.headers.get('x-ratelimit-reset'), 10);

  return {
    remaining: !isNaN(remaining) ? remaining : null,
    limit: !isNaN(limit) ? limit : null,
    resetAt: !isNaN(resetAt) ? new Date(resetAt * 1000) : null,
  }
}