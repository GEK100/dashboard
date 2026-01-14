import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/security"
import { z } from "zod"

const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"

    const rawBody = await request.json()

    // Validate input
    const parseResult = LoginSchema.safeParse(rawBody)
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || "Invalid input" },
        { status: 400 }
      )
    }

    const { email, password } = parseResult.data

    // Rate limiting by email (prevent brute force on specific accounts)
    const emailRateLimit = checkRateLimit(`login:email:${email.toLowerCase()}`, 5, 300000) // 5 attempts per 5 min
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in a few minutes." },
        { status: 429 }
      )
    }

    // Rate limiting by IP (prevent distributed attacks)
    const ipRateLimit = checkRateLimit(`login:ip:${ip}`, 20, 300000) // 20 attempts per 5 min
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts from this location. Please try again later." },
        { status: 429 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: { id: data.user?.id, email: data.user?.email }
    })

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
