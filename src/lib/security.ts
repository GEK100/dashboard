// Security utilities for the application
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

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
 * Redis-based rate limiter for serverless environments
 * Falls back to in-memory rate limiting if Redis is not configured
 */

// Create Redis client only if environment variables are set
let redis: Redis | null = null
let ratelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
    prefix: "ictus-flow",
  })
}

// In-memory fallback for development
const rateLimitMap = new Map<string, { count: number; timestamp: number }>()

/**
 * Check rate limit for a given key
 * Uses Redis in production, falls back to in-memory in development
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  // Use Redis-based rate limiting if available
  if (ratelimit) {
    const { success, remaining, reset } = await ratelimit.limit(key)
    return {
      allowed: success,
      remaining,
      resetIn: Math.max(0, reset - Date.now()),
    }
  }

  // Fallback to in-memory rate limiting (for local development)
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

/**
 * Synchronous rate limit check (for backward compatibility)
 * Uses in-memory only - prefer async checkRateLimit for production
 */
export function checkRateLimitSync(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now - record.timestamp > windowMs) {
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

// Clean up old in-memory rate limit entries periodically (for development)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    const windowMs = 60000
    for (const [key, record] of rateLimitMap.entries()) {
      if (now - record.timestamp > windowMs * 2) {
        rateLimitMap.delete(key)
      }
    }
  }, 60000)
}
