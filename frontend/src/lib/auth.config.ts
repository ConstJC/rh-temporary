import type { AuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import type { UserType } from "@/types/domain.types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const baseUrl = apiUrl.replace(/\/$/, "");
const ACCESS_TOKEN_FALLBACK_TTL_MS = 15 * 60 * 1000;
const ACCESS_TOKEN_REFRESH_BUFFER_MS = 30 * 1000;

type RefreshResponse = {
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id?: string;
    role?: string;
    userType?: UserType;
    isEmailVerified?: boolean;
  };
};

function decodeJwtExpMs(accessToken?: string): number {
  if (!accessToken) return Date.now() + ACCESS_TOKEN_FALLBACK_TTL_MS;

  try {
    const payload = accessToken.split(".")[1];
    if (!payload) return Date.now() + ACCESS_TOKEN_FALLBACK_TTL_MS;
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: number };
    if (typeof decoded.exp === "number") return decoded.exp * 1000;
  } catch {
    // Ignore malformed JWT and use fallback TTL.
  }

  return Date.now() + ACCESS_TOKEN_FALLBACK_TTL_MS;
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  const refreshToken = token.refreshToken as string | undefined;
  if (!refreshToken || !baseUrl) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  try {
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      return { ...token, error: "RefreshAccessTokenError" };
    }

    const json = await res.json();
    const data = (json.data ?? json) as RefreshResponse;
    const nextAccessToken =
      data.accessToken ?? (token.accessToken as string | undefined);
    const nextRefreshToken = data.refreshToken ?? refreshToken;

    return {
      ...token,
      sub: data.user?.id ?? token.sub,
      role: data.user?.role ?? token.role,
      userType: data.user?.userType ?? token.userType,
      isEmailVerified: data.user?.isEmailVerified ?? token.isEmailVerified,
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      accessTokenExpiresAt: decodeJwtExpMs(nextAccessToken),
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await fetch(`${baseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email as string,
              password: credentials.password as string,
            }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const msg = body?.error?.message ?? "Invalid credentials";
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
        const accessToken = (user as { accessToken?: string }).accessToken;
        token.accessToken = accessToken;
        token.refreshToken = (user as { refreshToken?: string }).refreshToken;
        token.role = (user as { role?: string }).role;
        token.userType = (user as { userType?: UserType }).userType;
        token.isEmailVerified = (
          user as { isEmailVerified?: boolean }
        ).isEmailVerified;
        token.sub = user.id as string;
        token.accessTokenExpiresAt = decodeJwtExpMs(accessToken);
        token.error = undefined;
        return token;
      }

      const expiresAt = (token.accessTokenExpiresAt as number | undefined) ?? 0;
      const shouldRefresh =
        Date.now() >= expiresAt - ACCESS_TOKEN_REFRESH_BUFFER_MS;

      if (!shouldRefresh) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      if (session.user) {
        (session as unknown as { accessToken?: string }).accessToken =
          token.accessToken as string;
        (session as unknown as { refreshToken?: string }).refreshToken =
          token.refreshToken as string;
        session.user.id = token.sub ?? "";
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { userType?: UserType }).userType =
          token.userType as UserType;
        (session.user as { isEmailVerified?: boolean }).isEmailVerified =
          token.isEmailVerified as boolean;
        (session as unknown as { error?: string }).error = token.error as
          | string
          | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
};
