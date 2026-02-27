import type { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { UserType } from '@/types/domain.types';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
const baseUrl = apiUrl.replace(/\/$/, '');

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email as string,
              password: credentials.password as string,
            }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const msg = body?.error?.message ?? 'Invalid credentials';
            throw new Error(msg);
          }
          const json = await res.json();
          const data = json.data ?? json;
          return {
            id: data.user?.id,
            email: data.user?.email,
            role: data.user?.role,
            userType: data.user?.userType,
            isEmailVerified: data.user?.isEmailVerified,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          };
        } catch (e) {
          throw e;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
        token.refreshToken = (user as { refreshToken?: string }).refreshToken;
        token.role = (user as { role?: string }).role;
        token.userType = (user as { userType?: UserType }).userType;
        token.isEmailVerified = (user as { isEmailVerified?: boolean }).isEmailVerified;
        token.sub = user.id as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as unknown as { accessToken?: string }).accessToken = token.accessToken as string;
        (session as unknown as { refreshToken?: string }).refreshToken = token.refreshToken as string;
        session.user.id = token.sub ?? '';
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { userType?: UserType }).userType = token.userType as UserType;
        (session.user as { isEmailVerified?: boolean }).isEmailVerified = token.isEmailVerified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },
};
