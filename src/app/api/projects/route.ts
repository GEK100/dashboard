import { createClient, createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit } from "@/lib/security"

// Validation schema for project creation
const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255),
  reference: z.string().max(100).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  postcode: z.string().max(20).optional().nullable(),
  start_date: z.string().optional().nullable(),
  target_completion: z.string().optional().nullable(),
  contract_value: z.union([z.string(), z.number()]).optional().nullable(),
  client_name: z.string().max(255).optional().nullable(),
  client_contact_name: z.string().max(255).optional().nullable(),
  client_contact_email: z.string().email().max(255).optional().nullable().or(z.literal("")),
  client_sector: z.string().max(100).optional().nullable(),
  project_type: z.string().max(100).optional().nullable(),
  building_type: z.string().max(100).optional().nullable(),
  rfi_response_days: z.number().int().min(1).max(90).optional(),
  warning_threshold_days: z.number().int().min(1).max(30).optional(),
  client_portal_enabled: z.boolean().optional(),
  // Risk profile fields
  occupied_building: z.boolean().optional(),
  working_at_height: z.boolean().optional(),
  hot_works: z.boolean().optional(),
  live_services: z.boolean().optional(),
  asbestos_presence: z.boolean().optional(),
  confined_spaces: z.boolean().optional(),
  public_interface: z.boolean().optional(),
  manual_handling: z.boolean().optional(),
  hazardous_substances: z.boolean().optional(),
  lifting_operations: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Rate limiting
    const rateLimit = checkRateLimit(`projects:${user.id}`, 10, 60000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", resetIn: rateLimit.resetIn },
        { status: 429 }
      )
    }

    const rawBody = await request.json()

    // Validate input
    const parseResult = CreateProjectSchema.safeParse(rawBody)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const body = parseResult.data

    // Use service client to get profile (bypasses RLS)
    const serviceClient = await createServiceClient()
    const { data: profileData } = await serviceClient
      .from("user_profiles")
      .select("company_id, role")
      .eq("id", user.id)
      .single()

    const profile = profileData as { company_id: string | null; role: string } | null

    if (!profile?.company_id) {
      return NextResponse.json({ error: "No company found. Please complete setup first." }, { status: 400 })
    }

    // Check permission
    if (!["admin", "director", "super_admin", "pm"].includes(profile.role)) {
      return NextResponse.json({ error: "You don't have permission to create projects" }, { status: 403 })
    }

    // Create project
    const { data: project, error: projectError } = await serviceClient
      .from("projects")
      .insert({
        company_id: profile.company_id,
        name: body.name,
        reference: body.reference || null,
        address: body.address || null,
        postcode: body.postcode || null,
        start_date: body.start_date || null,
        target_completion: body.target_completion || null,
        contract_value: body.contract_value ? (typeof body.contract_value === 'number' ? body.contract_value : parseFloat(body.contract_value)) : null,
        client_name: body.client_name || null,
        client_contact_name: body.client_contact_name || null,
        client_contact_email: body.client_contact_email || null,
        client_sector: body.client_sector || null,
        project_type: body.project_type || null,
        building_type: body.building_type || null,
        rfi_response_days: body.rfi_response_days || 7,
        warning_threshold_days: body.warning_threshold_days || 2,
        created_by: user.id,
      } as never)
      .select()
      .single()

    if (projectError) {
      console.error("Project creation error:", projectError)
      return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
    }

    // Create risk profile if provided
    if (project) {
      const hasRisks = body.occupied_building || body.working_at_height || body.hot_works ||
        body.live_services || body.asbestos_presence || body.confined_spaces ||
        body.public_interface || body.manual_handling || body.hazardous_substances ||
        body.lifting_operations

      if (hasRisks) {
        await serviceClient
          .from("project_risk_profiles")
          .insert({
            project_id: (project as { id: string }).id,
            occupied_building: body.occupied_building || false,
            working_at_height: body.working_at_height || false,
            hot_works: body.hot_works || false,
            live_services: body.live_services || false,
            asbestos_presence: body.asbestos_presence || false,
            confined_spaces: body.confined_spaces || false,
            public_interface: body.public_interface || false,
            manual_handling: body.manual_handling || false,
            hazardous_substances: body.hazardous_substances || false,
            lifting_operations: body.lifting_operations || false,
          } as never)
      }

      // Create client portal settings if enabled
      if (body.client_portal_enabled) {
        await serviceClient
          .from("client_portal_settings")
          .insert({
            project_id: (project as { id: string }).id,
            enabled: true,
          } as never)
      }

      // Add creator as project user (PM role)
      await serviceClient
        .from("project_users")
        .insert({
          project_id: (project as { id: string }).id,
          user_id: user.id,
          role: "pm",
        } as never)
    }

    return NextResponse.json({
      success: true,
      project: { id: (project as { id: string }).id }
    })
  } catch (error) {
    console.error("Project creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
