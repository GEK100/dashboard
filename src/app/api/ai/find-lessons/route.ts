import { NextResponse } from "next/server"

// AI STUB: Lesson Matching
// This endpoint will find relevant lessons based on context (blockers, diary entries, etc.)
// Implementation deferred to Phase 2

export async function POST() {
  return NextResponse.json(
    {
      status: "not_implemented",
      message: "AI lesson matching coming soon",
      // Expected future response:
      // matches: {
      //   lessonId: string,
      //   title: string,
      //   relevanceScore: number,
      //   reason: string
      // }[]
    },
    { status: 501 }
  )
}
