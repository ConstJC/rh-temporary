import { authHttp } from "./axios-base";
import { apiClient } from "./client";
import { API_ENDPOINTS } from "@/lib/constants";
import type {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from "@/lib/validations/auth.schema";
import type { LoginUser } from "@/types/domain.types";

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: LoginUser;
}

export interface RegisterResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
}

export async function login(dto: LoginDto): Promise<LoginResponse> {
  const { data } = await authHttp.post<{ data: LoginResponse }>(
    API_ENDPOINTS.AUTH.LOGIN,
    dto,
  );
  return data.data;
}

export async function register(dto: RegisterDto): Promise<RegisterResponse> {
  const { data } = await authHttp.post<{ data: RegisterResponse }>(
    API_ENDPOINTS.AUTH.REGISTER,
    dto,
  );
  return data.data;
}

export async function refreshToken(
  refreshToken: string,
): Promise<LoginResponse> {
  const { data } = await authHttp.post<{ data: LoginResponse }>(
    API_ENDPOINTS.AUTH.REFRESH,
    { refreshToken },
  );
  return data.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
}

export async function forgotPassword(
  dto: ForgotPasswordDto,
): Promise<{ message: string }> {
  const { data } = await authHttp.post<{ data: { message: string } }>(
    API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
    dto,
  );
  return data.data;
}

export async function resetPassword(
  dto: ResetPasswordDto,
): Promise<{ message: string }> {
  const { data } = await authHttp.post<{ data: { message: string } }>(
    API_ENDPOINTS.AUTH.RESET_PASSWORD,
    dto,
  );
  return data.data;
}

export async function verifyEmail(
  dto: VerifyEmailDto,
): Promise<{ message: string }> {
  const { data } = await authHttp.post<{ data: { message: string } }>(
    API_ENDPOINTS.AUTH.VERIFY_EMAIL,
    dto,
  );
  return data.data;
}
