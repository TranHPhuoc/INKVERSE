import api from "./api";
import type { ApiEnvelope } from "../types/http";
import type {AxiosError} from "axios";

type ErrorResponse = {
    message?: string;
    error?: string;
    detail?: string;
};
export type RegisterPayload = {
    email: string;
    password: string;
    username?: string;
    fullName?: string;
    phone?: string;
};

export type VerifyEmailPayload = RegisterPayload & { otp: string };
export type LoginPayload = { username: string; password: string };
export type ForgotStartPayload = {email: string};
export type ForgotVerifyPayload = {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
}
export type ChangePasswordPayload = {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export const AuthAPI = {
    registerStart: (data: RegisterPayload) =>
        api.post<ApiEnvelope<{ message: string }>>("/api/v1/auth/register", data),

    verifyEmail: (data: VerifyEmailPayload) =>
        api.post<ApiEnvelope<{ userId: number; message: string }>>("/api/v1/auth/verify-email", data),

    resendOtp: (email: string) =>
        api.post<ApiEnvelope<{ message: string }>>("/api/v1/auth/resend-otp", { email }),

    login: (data: LoginPayload) =>
        api.post<ApiEnvelope<{ accessToken: string }>>("/api/v1/auth/login", data),

    forgotPasswordStart: (data: ForgotStartPayload) =>
        api.post("/api/v1/auth/forgot-password/start",data),

    forgotPasswordVerify: (data: ForgotVerifyPayload) =>
        api.post("/api/v1/auth/forgot-password/verify",data),

    changePassword: (data: ChangePasswordPayload, accessToken: string) =>
        api.put("/users/change-password", data, {
            headers: { Authorization: `Bearer ${accessToken}` },
        }),

    refresh: () => api.post("/api/v1/auth/refresh", {}),

    logout: () => api.post("/api/v1/auth/logout", {}),
};
export function getAxiosErrMsg(
    err: unknown,
    fallback = "Đã có lỗi xảy ra"
): string {
    if (err && typeof err === "object" && "isAxiosError" in err) {
        const axiosErr = err as AxiosError<ErrorResponse>;
        return (
            axiosErr.response?.data?.message ||
            axiosErr.response?.data?.error ||
            axiosErr.response?.data?.detail ||
            axiosErr.message ||
            fallback
        );
    }
    if (err instanceof Error) return err.message;
    return fallback;
}
