import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/security"
import { z } from "zod"

// Schema for RAMS submission
const RamsSubmissionSchema = z.object({
  token: z.string().uuid("Invalid upload token format"),
  company_name: z.string().min(2, "Company name required").max(255),
  contact_name: z.string().min(2, "Contact name required").max(255),
  contact_email: z.string().email("Invalid email address").max(255),
  document_url: z.string().url("Invalid document URL"),
  document_name: z.string().min(1, "Document name required").max(255),
})

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting (public endpoint)
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"

    // Rate limiting by IP for public endpoint
    const rateLimit = checkRateLimit(`rams-submit:${ip}`, 5, 300000) // 5 submissions per 5 minutes
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again later.", resetIn: rateLimit.resetIn },
        { status: 429 }
      )
    }

    const body = await request.json()

    // Validate input
    const result = RamsSubmissionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { token, company_name, contact_name, contact_email, document_url, document_name } = result.data

    // Use service client to validate token and perform operations
    const serviceClient = await createServiceClient()

    // Verify token exists and is valid (awaiting status)
    const { data: packageData, error: packageError } = await serviceClient
      .from("rams_packages")
      .select("id, project_id, package_name, status")
      .eq("upload_token", token)
      .single()

    if (packageError || !packageData) {
      return NextResponse.json(
        { error: "Invalid or expired upload link" },
        { status: 404 }
      )
    }

    const pkg = packageData as { id: string; project_id: string; package_name: string; status: string }

    // Check if already submitted
    if (pkg.status !== "awaiting") {
      return NextResponse.json(
        { error: "This RAMS has already been submitted" },
        { status: 400 }
      )
    }

    // Additional rate limit per token (prevent re-submission abuse)
    const tokenRateLimit = checkRateLimit(`rams-token:${token}`, 3, 3600000) // 3 attempts per hour per token
    if (!tokenRateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many submission attempts for this link. Please try again later." },
        { status: 429 }
      )
    }

    // Create submission record
    const { error: submissionError } = await serviceClient
      .from("rams_submissions")
      .insert({
        project_id: pkg.project_id,
        package_id: pkg.id,
        package_name: pkg.package_name,
        subcontractor_company: company_name,
        document_url: document_url,
        document_name: document_name,
        submitted_by_name: contact_name,
        submitted_by_email: contact_email,
        pm_status: "pending",
      } as never)

    if (submissionError) {
      console.error("RAMS submission error:", submissionError)
      return NextResponse.json(
        { error: "Failed to create submission" },
        { status: 500 }
      )
    }

    // Update package status to submitted
    const { error: updateError } = await serviceClient
      .from("rams_packages")
      .update({ status: "submitted" } as never)
      .eq("id", pkg.id)

    if (updateError) {
      console.error("Package update error:", updateError)
      // Submission was created, so we don't fail completely
    }

    return NextResponse.json({
      success: true,
      message: "RAMS submitted successfully"
    })

  } catch (error) {
    console.error("RAMS submission error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
