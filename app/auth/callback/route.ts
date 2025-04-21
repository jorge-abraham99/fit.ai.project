// import { createClient } from '@/lib/supabase/server' // No longer needed
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs' // Use this for Route Handlers
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = cookies()
    // Use createRouteHandlerClient for Route Handlers
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // URL to redirect to after sign in process completes
      return NextResponse.redirect(`${origin}/questionnaire`)
    }
    
    // Log error if exchange fails
    console.error('Supabase auth callback error:', error.message)
  }

  // URL to redirect to if code is not found or exchange fails
  return NextResponse.redirect(`${origin}/auth/auth-code-error`) // Consider creating this page
} 