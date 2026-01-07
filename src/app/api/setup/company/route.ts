import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { companyName } = body

    if (!companyName || typeof companyName !== "string") {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 })
    }

    const sanitizedName = companyName.trim().substring(0, 255)
    if (sanitizedName.length < 2) {
      return NextResponse.json({ error: "Company name must be at least 2 characters" }, { status: 400 })
    }

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
