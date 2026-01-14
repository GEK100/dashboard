import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/security"

// AI STUB: Lesson Matching
// This endpoint will find relevant lessons based on context (blockers, diary entries, etc.)
// Implementation deferred to Phase 2

export async function POST(request: Request) {
  // Authentication check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limiting
  const rateLimit = checkRateLimit(`ai-lessons:${user.id}`, 30, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", resetIn: rateLimit.resetIn },
      { status: 429 }
    )
  }

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
