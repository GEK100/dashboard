import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { validateRedirectUrl } from '@/lib/security'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawRedirectTo = searchParams.get('redirectTo')

  // Validate redirect URL to prevent open redirect attacks
  const redirectTo = validateRedirectUrl(rawRedirectTo)

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

          try {
            if (metadata?.company_name) {
              // This is a new company signup
              const companyName = String(metadata.company_name).substring(0, 255)
              const slug = companyName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .substring(0, 50)

              // Create company
              const { data: company, error: companyError } = await serviceClient
                .from('companies')
                .insert({
                  name: companyName,
                  slug: `${slug}-${Date.now()}`,
                } as never)
                .select()
                .single()

              if (companyError) {
                console.error('Company creation failed:', companyError.message)
                return NextResponse.redirect(`${origin}/login?error=company_creation_failed`)
              }

              if (company) {
                // Create user profile as admin
                const { error: profileError } = await serviceClient
                  .from('user_profiles')
                  .insert({
                    id: user.id,
                    email: user.email!,
                    full_name: String(metadata.full_name || 'Admin').substring(0, 255),
                    company_id: (company as { id: string }).id,
                    role: 'admin',
                  } as never)

                if (profileError) {
                  console.error('Profile creation failed:', profileError.message)
                  return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`)
                }
              }
            } else {
              // User was invited - profile should exist from invitation
              // If not, create a basic profile
              const { error: profileError } = await serviceClient
                .from('user_profiles')
                .insert({
                  id: user.id,
                  email: user.email!,
                  full_name: String(metadata?.full_name || user.email!.split('@')[0]).substring(0, 255),
                  role: 'viewer',
                } as never)

              if (profileError) {
                console.error('Profile creation failed:', profileError.message)
                return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`)
              }
            }
          } catch (err) {
            console.error('Unexpected error during profile creation:', err)
            return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`)
          }
        }
      }

      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
