import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/security"
import { z } from "zod"

const MagicLinkSchema = z.object({
  email: z.string().email("Invalid email address"),
  redirectTo: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"

    const rawBody = await request.json()

    // Validate input
    const parseResult = MagicLinkSchema.safeParse(rawBody)
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || "Invalid email" },
        { status: 400 }
      )
    }

    const { email, redirectTo } = parseResult.data

    // Rate limiting by email (prevent email bombing)
    const emailRateLimit = checkRateLimit(`magic:email:${email.toLowerCase()}`, 3, 600000) // 3 per 10 min per email
    if (!emailRateLimit.allowed) {
      // Don't reveal that we're rate limiting
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a login link has been sent"
      })
    }

    // Rate limiting by IP
    const ipRateLimit = checkRateLimit(`magic:ip:${ip}`, 15, 600000) // 15 per 10 min per IP
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const supabase = await createClient()

    // Get the origin for the redirect URL
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Validate redirectTo is a safe path
    const safeRedirect = redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/dashboard"

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback?redirectTo=${encodeURIComponent(safeRedirect)}`,
      },
    })

    // Don't reveal whether the email exists
    if (error) {
      console.error("Magic link error:", error.message)
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a login link has been sent"
    })

  } catch (error) {
    console.error("Magic link error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
