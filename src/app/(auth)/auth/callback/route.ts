import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user profile exists, if not create one
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // Use service client for creating records (bypasses RLS)
          const serviceClient = await createServiceClient()
          const metadata = user.user_metadata

          if (metadata?.company_name) {
            // This is a new company signup
            const slug = (metadata.company_name as string)
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
              .substring(0, 50)

            // Create company using raw insert to avoid type inference issues
            const { data: company, error: companyError } = await serviceClient
              .from('companies')
              .insert({
                name: metadata.company_name as string,
                slug: `${slug}-${Date.now()}`,
              } as never)
              .select()
              .single()

            if (!companyError && company) {
              // Create user profile as admin
              await serviceClient
                .from('user_profiles')
                .insert({
                  id: user.id,
                  email: user.email!,
                  full_name: (metadata.full_name as string) || 'Admin',
                  company_id: (company as { id: string }).id,
                  role: 'admin',
                } as never)
            }
          } else {
            // User was invited - profile should exist from invitation
            // If not, create a basic profile
            await serviceClient
              .from('user_profiles')
              .insert({
                id: user.id,
                email: user.email!,
                full_name: (metadata?.full_name as string) || user.email!.split('@')[0],
                role: 'viewer',
              } as never)
          }
        }
      }

      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
