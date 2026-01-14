import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/security"

// AI STUB: Report Generation
// This endpoint will generate weekly reports from project data
// Implementation deferred to Phase 2

export async function POST(request: Request) {
  // Authentication check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limiting
  const rateLimit = checkRateLimit(`ai-report:${user.id}`, 5, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", resetIn: rateLimit.resetIn },
      { status: 429 }
    )
  }

  return NextResponse.json(
    {
      status: "not_implemented",
      message: "AI report generation coming soon",
      // Expected future response:
      // report: {
      //   executiveSummary: string,
      //   progressSummary: string,
      //   issuesSummary: string,
      //   lookaheadSummary: string,
      //   suggestedRag: 'green' | 'amber' | 'red',
      //   keyMetrics: { label: string, value: number }[]
      // }
    },
    { status: 501 }
  )
}
