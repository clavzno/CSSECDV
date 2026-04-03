import { NextResponse } from 'next/server';

export function middleware(request) {
  // 1. Grab the session cookie we set in the login API
  const sessionCookie = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // 2. Define our public routes (Login, and eventually Registration)
  const publicRoutes = ['/', '/register', '/CreateAccount', '/ForgotPassword'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // 3. If they are trying to access a protected page WITHOUT a session cookie
  if (!sessionCookie && !isPublicRoute) {
    // Fail securely: Kick them back to the login page
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. If they are logged in and try to go to the login page, 
  // redirect them straight to their dashboard so they don't get stuck.
  if (sessionCookie && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 5. Allow the request to proceed
  return NextResponse.next();
}

// 6. The Matcher: This tells Next.js exactly which routes this middleware should run on.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files like your globals.css)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images in the public folder (Login-bg.png, Tiggets.png)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|Login-bg.png|Tiggets.png).*)',
  ],
};