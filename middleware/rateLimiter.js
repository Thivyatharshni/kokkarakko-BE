const rateLimitMap = new Map();

/**
 * Lightweight in-memory rate limiter for analytics endpoints.
 */
export const viewRateLimiter = (req, res, next) => {
  const key = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();
  const limitWindow = 60 * 1000; // 1 minute
  const maxRequests = 30; // Max 30 requests per minute (to allow quick navigation / parallel batches if any)
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, []);
  }
  
  const requests = rateLimitMap.get(key).filter(time => now - time < limitWindow);
  if (requests.length >= maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests from this IP. Please try again later.'
    });
  }
  
  requests.push(now);
  rateLimitMap.set(key, requests);
  next();
};
