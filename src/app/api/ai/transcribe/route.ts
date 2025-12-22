import { NextResponse } from "next/server"

// AI STUB: Voice Transcription
// This endpoint will transcribe voice recordings for diary entries
// Implementation deferred to Phase 2

export async function POST() {
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
