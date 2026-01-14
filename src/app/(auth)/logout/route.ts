import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// POST method to prevent CSRF attacks via link/image injection
export async function POST(request: Request) {
  // Verify the request origin to prevent CSRF
  const origin = request.headers.get("origin")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  // In production, verify origin matches our app
  if (process.env.NODE_ENV === "production" && origin && !appUrl.startsWith(origin)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }

  const supabase = await createClient()
  await supabase.auth.signOut()

  return NextResponse.json({ success: true, redirectTo: "/login" })
}

// Redirect GET requests to login with a message
export async function GET() {
  return NextResponse.redirect(new URL("/login?message=use_post_logout", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
}
