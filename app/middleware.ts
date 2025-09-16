
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Allow the request to proceed if authenticated
    return;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to dashboard only if token exists
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*']
};
