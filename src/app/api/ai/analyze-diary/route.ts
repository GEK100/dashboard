import { NextResponse } from "next/server"

// AI STUB: Diary Entry Analysis
// This endpoint will analyze diary entries for sentiment, entities, and suggestions
// Implementation deferred to Phase 2

export async function POST() {
  return NextResponse.json(
    {
      status: "not_implemented",
      message: "Diary analysis coming soon",
      // Expected future response:
      // analysis: {
      //   sentiment: 'positive' | 'neutral' | 'concern',
      //   entities: { type: string, value: string }[],
      //   suggestedRfis: { title: string, reason: string }[],
      //   suggestedBlockers: { title: string, reason: string }[],
      //   relatedLessons: string[]
      // }
    },
    { status: 501 }
  )
}
