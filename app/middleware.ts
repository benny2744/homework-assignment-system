
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // This function will only be invoked if the token is valid
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*']
};
