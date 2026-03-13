const hits = new Map();

export function simpleRateLimit({ windowMs = 60_000, max = 10 } = {}) {
  return (req, res, next) => {
    const key = req.ip + req.path;
    const now = Date.now();
    const current = hits.get(key) || [];
    const filtered = current.filter((t) => now - t < windowMs);
    if (filtered.length >= max) {
      return res.status(429).json({ error: "Too many requests. Try again later." });
    }
    filtered.push(now);
    hits.set(key, filtered);
    return next();
  };
}
