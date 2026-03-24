"use client";

import axios, { type AxiosError } from "axios";
import { getSession, signOut } from "next-auth/react";
import { normalizeApiError, type ApiError } from "@/types/api.types";
import { ROUTES } from "@/lib/constants";

const baseURL =
  typeof window !== "undefined"
    ? `${process.env.NEXT_PUBLIC_API_URL ?? ""}`.replace(/\/$/, "")
    : (process.env.NEXT_PUBLIC_API_URL ?? "");

export const apiClient = axios.create({
  baseURL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    const token = session?.accessToken as string | undefined;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err),
);

apiClient.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const status = err.response?.status;

    if (status === 401) {
      await signOut({ callbackUrl: ROUTES.LOGIN });
      if (typeof window !== "undefined") {
        window.location.href = ROUTES.LOGIN;
      }
      return Promise.reject(normalizeApiError(err));
    }

    if (status === 402) {
      if (typeof window !== "undefined") {
        window.location.href = "/upgrade";
      }
      return Promise.reject(normalizeApiError(err));
    }

    if (status === 403) {
      if (typeof window !== "undefined") {
        window.location.href = "/forbidden";
      }
      return Promise.reject(normalizeApiError(err));
    }

    return Promise.reject(normalizeApiError(err));
  },
);

export function getApiError(err: unknown): ApiError {
  return normalizeApiError(err);
}
