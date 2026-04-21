function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}

function createRateLimiter({ windowMs, maxRequests, keyFn }) {
  const requests = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = keyFn(req);
    const existing = requests.get(key);

    if (!existing || now > existing.resetAt) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (existing.count >= maxRequests) {
      const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      return res.status(429).json({ error: "Too many requests. Try again later." });
    }

    existing.count += 1;
    return next();
  };
}

module.exports = {
  securityHeaders,
  createRateLimiter,
};
