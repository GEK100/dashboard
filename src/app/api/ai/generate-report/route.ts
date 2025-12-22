import { NextResponse } from "next/server"

// AI STUB: Report Generation
// This endpoint will generate weekly reports from project data
// Implementation deferred to Phase 2

export async function POST() {
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
