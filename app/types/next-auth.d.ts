
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username?: string;
      name?: string;
      email?: string;
    }
  }

  interface User {
    id: string;
    username?: string;
    name?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string;
  }
}
