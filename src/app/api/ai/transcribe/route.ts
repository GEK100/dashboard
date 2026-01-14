import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/security"

// AI STUB: Voice Transcription
// This endpoint will transcribe voice recordings for diary entries
// Implementation deferred to Phase 2

export async function POST(request: Request) {
  // Authentication check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limiting
  const rateLimit = checkRateLimit(`ai-transcribe:${user.id}`, 20, 60000)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", resetIn: rateLimit.resetIn },
      { status: 429 }
    )
  }

  return NextResponse.json(
    {
      status: "not_implemented",
      message: "Voice transcription coming soon",
      // Expected future response:
      // transcription: {
      //   text: string,
      //   confidence: number,
      //   language: string,
      //   duration: number
      // }
    },
    { status: 501 }
  )
}
