import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimitSync, validatePassword } from "@/lib/security"
import { z } from "zod"

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

const SignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters").max(255),
  companyName: z.string().min(2, "Company name must be at least 2 characters").max(255),
})

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"

    // Rate limiting by IP (prevent mass account creation)
    const ipRateLimit = checkRateLimitSync(`signup:ip:${ip}`, 5, 3600000) // 5 signups per hour per IP
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429 }
      )
    }

    const rawBody = await request.json()

    // Validate input
    const parseResult = SignupSchema.safeParse(rawBody)
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || "Invalid input" },
        { status: 400 }
      )
    }

    const { email, password, fullName, companyName } = parseResult.data

    // Additional password strength validation
    const passwordError = validatePassword(password)
    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
        { status: 400 }
      )
    }

    // Rate limiting by email (prevent multiple signups with same email)
    const emailRateLimit = checkRateLimitSync(`signup:email:${email.toLowerCase()}`, 3, 3600000) // 3 attempts per hour
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many signup attempts for this email. Please try again later." },
        { status: 429 }
      )
    }

    const supabase = await createClient()

    // Get the origin for the redirect URL
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          full_name: fullName,
          company_name: companyName,
        },
      },
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Please check your email to confirm your account",
      user: { id: data.user?.id, email: data.user?.email }
    })

  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
