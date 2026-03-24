import type { UserType } from "./domain.types";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: string;
    userType?: UserType;
    isEmailVerified?: boolean;
    accessToken?: string;
    refreshToken?: string;
  }

  interface Session {
    accessToken?: string;
    refreshToken?: string;
    error?: string;
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    userType?: UserType;
    isEmailVerified?: boolean;
    accessTokenExpiresAt?: number;
    error?: string;
  }
}
