import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit } from "@/lib/security"

// Validation schema for company setup
const SetupCompanySchema = z.object({
  companyName: z.string()
    .min(2, "Company name must be at least 2 characters")
    .max(255, "Company name must be less than 255 characters")
    .transform(val => val.trim()),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting - prevent mass company creation
    const rateLimit = checkRateLimit(`setup:${user.id}`, 3, 3600000) // 3 attempts per hour
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later.", resetIn: rateLimit.resetIn },
        { status: 429 }
      )
    }

    const rawBody = await request.json()

    // Validate input
    const parseResult = SetupCompanySchema.safeParse(rawBody)
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || "Invalid company name" },
        { status: 400 }
      )
    }

    const sanitizedName = parseResult.data.companyName

    // Use service client to bypass RLS
    const serviceClient = await createServiceClient()

    // Check if user already has a company
    const { data: existingProfileData } = await serviceClient
      .from("user_profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()

    const existingProfile = existingProfileData as { company_id: string | null } | null

    if (existingProfile?.company_id) {
      return NextResponse.json({ error: "You already belong to a company" }, { status: 400 })
    }

    // Create company
    const slug = sanitizedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50)

    const { data: company, error: companyError } = await serviceClient
      .from("companies")
      .insert({
        name: sanitizedName,
        slug: `${slug}-${Date.now()}`,
      } as never)
      .select()
      .single()

    if (companyError || !company) {
      console.error("Company creation failed:", companyError?.message)
      return NextResponse.json({ error: "Failed to create company" }, { status: 500 })
    }

    // Update user profile with company_id and make them admin
    const { error: updateError } = await serviceClient
      .from("user_profiles")
      .update({
        company_id: (company as { id: string }).id,
        role: "admin",
      } as never)
      .eq("id", user.id)

    if (updateError) {
      console.error("Profile update failed:", updateError.message)
      // Try to clean up the company
      await serviceClient.from("companies").delete().eq("id", (company as { id: string }).id)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      company: { id: (company as { id: string }).id, name: sanitizedName }
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
