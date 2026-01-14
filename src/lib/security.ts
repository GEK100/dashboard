// Security utilities for the application

// Allowed redirect paths (whitelist approach)
const ALLOWED_REDIRECT_PATHS = [
  '/dashboard',
  '/projects',
  '/lessons',
  '/settings',
  '/profile',
]

/**
 * Validates and sanitizes redirect URLs to prevent open redirect attacks
 * Only allows relative paths that start with allowed prefixes
 */
export function validateRedirectUrl(redirectTo: string | null): string {
  const defaultRedirect = '/dashboard'

  if (!redirectTo) {
    return defaultRedirect
  }

  // Must start with /
  if (!redirectTo.startsWith('/')) {
    return defaultRedirect
  }

  // Prevent protocol-relative URLs (//evil.com)
  if (redirectTo.startsWith('//')) {
    return defaultRedirect
  }

  // Prevent javascript: URLs
  if (redirectTo.toLowerCase().includes('javascript:')) {
    return defaultRedirect
  }

  // Check if path starts with an allowed prefix
  const isAllowed = ALLOWED_REDIRECT_PATHS.some(
    (path) => redirectTo === path || redirectTo.startsWith(path + '/') || redirectTo.startsWith(path + '?')
  )

  if (!isAllowed) {
    return defaultRedirect
  }

  return redirectTo
}

/**
 * Sanitizes search input to prevent SQL injection in Supabase queries
 * Escapes special characters used in LIKE/ILIKE patterns
 */
export function sanitizeSearchInput(input: string): string {
  if (!input) return ''

  // Escape special LIKE pattern characters
  return input
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/%/g, '\\%')    // Escape percent signs
    .replace(/_/g, '\\_')    // Escape underscores
    .trim()
    .substring(0, 100)       // Limit length
}

/**
 * Validates password strength
 * Returns an error message if invalid, null if valid
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters'
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter'
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter'
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number'
  }

  return null
}

/**
 * Rate limiting helper - tracks requests per key
 * For use in API routes
 */
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now - record.timestamp > windowMs) {
    // New window
    rateLimitMap.set(key, { count: 1, timestamp: now })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }

  if (record.count >= maxRequests) {
    const resetIn = windowMs - (now - record.timestamp)
    return { allowed: false, remaining: 0, resetIn }
  }

  record.count++
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetIn: windowMs - (now - record.timestamp),
  }
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  const windowMs = 60000
  for (const [key, record] of rateLimitMap.entries()) {
    if (now - record.timestamp > windowMs * 2) {
      rateLimitMap.delete(key)
    }
  }
}, 60000)
