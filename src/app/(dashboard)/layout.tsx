import { redirect } from "next/navigation"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/Header"
import { Toaster } from "@/components/ui/sonner"
import type { UserProfile, Company } from "@/types/database"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Use service client to fetch profile (bypasses RLS issues)
  const serviceClient = await createServiceClient()

  let { data: profileData } = await serviceClient
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  let profile = profileData as UserProfile | null

  // Auto-create profile if missing (handles edge cases)
  if (!profile) {
    const metadata = user.user_metadata

    // Get or create company
    let companyId: string | null = null

    if (metadata?.company_name) {
      // Create new company for signup
      const slug = (metadata.company_name as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .substring(0, 50)

      const { data: newCompany } = await serviceClient
        .from("companies")
        .insert({
          name: metadata.company_name as string,
          slug: `${slug}-${Date.now()}`,
        } as never)
        .select()
        .single()

      if (newCompany) {
        companyId = (newCompany as { id: string }).id
      }
    }

    // Create profile
    const { data: newProfile, error: profileError } = await serviceClient
      .from("user_profiles")
      .insert({
        id: user.id,
        email: user.email!,
        full_name: (metadata?.full_name as string) || user.email!.split("@")[0],
        company_id: companyId,
        role: companyId ? "admin" : "viewer",
      } as never)
      .select()
      .single()

    if (profileError) {
      // If duplicate key, the profile exists - fetch it
      if (profileError.code === "23505") {
        const { data: existingProfile } = await serviceClient
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        profile = existingProfile as UserProfile | null
      } else {
        console.error("Profile creation failed:", profileError.message)
      }
    } else {
      profile = newProfile as UserProfile | null
    }

    if (!profile) {
      redirect("/login?error=profile_creation_failed")
    }
  }

  // Fetch company if user has one
  let company: Company | null = null
  if (profile.company_id) {
    const { data: companyData } = await supabase
      .from("companies")
      .select("*")
      .eq("id", profile.company_id)
      .single()
    company = companyData as Company | null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header user={profile} company={company} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      <Toaster />
    </div>
  )
}
