import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
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

  // Fetch user profile
  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  const profile = profileData as UserProfile | null

  if (!profile) {
    // User exists in auth but not in profiles - shouldn't happen normally
    redirect("/login?error=profile_not_found")
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
      <main className="container py-6">{children}</main>
      <Toaster />
    </div>
  )
}
