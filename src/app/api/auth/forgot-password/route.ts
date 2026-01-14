import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/security"
import { z } from "zod"

const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"

    const rawBody = await request.json()

    // Validate input
    const parseResult = ForgotPasswordSchema.safeParse(rawBody)
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || "Invalid email" },
        { status: 400 }
      )
    }

    const { email } = parseResult.data

    // Rate limiting by email (prevent email bombing)
    const emailRateLimit = checkRateLimit(`forgot:email:${email.toLowerCase()}`, 3, 3600000) // 3 per hour per email
    if (!emailRateLimit.allowed) {
      // Don't reveal that we're rate limiting - just say email sent
      // This prevents email enumeration
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a reset link has been sent"
      })
    }

    // Rate limiting by IP (prevent mass email bombing)
    const ipRateLimit = checkRateLimit(`forgot:ip:${ip}`, 10, 3600000) // 10 per hour per IP
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const supabase = await createClient()

    // Get the origin for the redirect URL
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    })

    // Don't reveal whether the email exists
    if (error) {
      console.error("Password reset error:", error.message)
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a reset link has been sent"
    })

  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
