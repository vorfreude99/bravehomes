import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Refreshes the Supabase auth token on every matched request and guards
 * /portal. Without this the session expires mid-visit and server
 * components start seeing a logged-out user.
 *
 * (Next 16 renamed the `middleware` convention to `proxy`.)
 */
export default async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!url.startsWith('http')) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && pathname.startsWith('/portal')) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = '/login';
    redirect.searchParams.set('next', pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && (pathname === '/login' || pathname === '/signup')) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = '/portal';
    redirect.search = '';
    return NextResponse.redirect(redirect);
  }

  // Every member has to pass age verification before /portal — checked
  // here rather than only in the layout so it also covers the very
  // first request after signup, before any portal page has rendered.
  //
  // Gated on Didit actually being configured: if those env vars are
  // ever missing (a bad deploy, a forgotten Vercel setting), this fails
  // open rather than locking every member — including whoever is
  // debugging it — out of the entire portal with no way back in.
  const diditConfigured = Boolean(process.env.DIDIT_API_KEY && process.env.DIDIT_WORKFLOW_ID);
  if (user && diditConfigured && pathname.startsWith('/portal')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('age_verification_status')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.age_verification_status !== 'approved') {
      const redirect = request.nextUrl.clone();
      redirect.pathname = '/verify-age';
      redirect.search = '';
      return NextResponse.redirect(redirect);
    }
  }

  return response;
}

export const config = {
  matcher: ['/portal/:path*', '/login', '/signup', '/verify-age/:path*'],
};
