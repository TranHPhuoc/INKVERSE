import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AuthAPI, type ChangePasswordPayload } from "../services/auth";
import type { RegisterPayload, VerifyEmailPayload, LoginPayload } from "../services/auth";
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from "../types/authKeys";
import type { ApiEnvelope } from "../types/http";
import { AuthContext } from "./AuthContextCore";

/* ================= Types (type-only exports are fine) ================= */

export type User = {
  id: number | string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  role?: string;
};

type AuthState = {
  accessToken: string | null;
  user: User | null;
  registerData: RegisterPayload | null;
};

export type AuthContextType = AuthState & {
  startRegister: (data: RegisterPayload) => Promise<void>;
  verifyEmail: (otp: string) => Promise<{ userId: number; message: string }>;
  resendOtp: () => Promise<void>;
  login: (data: LoginPayload) => Promise<void>;
  logout: () => void;

  forgotPasswordStart: (email: string) => Promise<void>;
  forgotPasswordVerify: (args: {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
  changePassword: (data: ChangePasswordPayload) => Promise<void>;

  setRegisterData: React.Dispatch<React.SetStateAction<RegisterPayload | null>>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthenticated: boolean;
};

/** JWT payload dự kiến từ BE (để tránh any) */
type JwtPayload = {
  userId?: number | string;
  id?: number | string;
  sub?: string;
  email?: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
  role?: string;
  roles?: string[];
};

/* =============== Utils (internal) =============== */

function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    // escape/unescape là cũ nhưng dùng tạm để decode UTF-8 string
    return JSON.parse(decodeURIComponent(escape(json))) as JwtPayload;
  } catch {
    return null;
  }
}

/* =============== Provider (only runtime export in this file) =============== */

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [registerData, setRegisterData] = useState<RegisterPayload | null>(null);

  const persistSession = useCallback((token: string | null, u?: User | null) => {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);

    if (typeof u !== "undefined") {
      if (u) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(u));
      else localStorage.removeItem(AUTH_USER_KEY);
    }
  }, []);

  // Hydrate từ localStorage
  useEffect(() => {
    const t = localStorage.getItem(AUTH_TOKEN_KEY);
    const rawU = localStorage.getItem(AUTH_USER_KEY);

    if (t) setAccessToken(t);

    if (rawU) {
      try {
        setUser(JSON.parse(rawU) as User);
      } catch {
        setUser(null);
      }
    } else if (t) {
      const p = decodeJwt(t) ?? {};
      const idRaw = p.userId ?? p.id ?? p.sub ?? "";
      const emailRaw = p.email ?? p.sub;
      const nameRaw = p.username ?? p.fullName;
      const avatarRaw = p.avatarUrl;
      const roleRaw = Array.isArray(p.roles) ? p.roles[0] : p.role;

      // Không gán undefined vào object literal (exactOptionalPropertyTypes)
      const u: User = {
        id: idRaw,
        ...(emailRaw ? { email: emailRaw } : {}),
        ...(nameRaw ? { name: nameRaw } : {}),
        ...(avatarRaw ? { avatarUrl: avatarRaw } : {}),
        ...(roleRaw ? { role: roleRaw } : {}),
      };
      setUser(u);
      persistSession(t, u);
    }
  }, [persistSession]);

  /* ===== Actions ===== */

  const startRegister = useCallback(async (data: RegisterPayload) => {
    await AuthAPI.registerStart(data);
    setRegisterData(data);
  }, []);

  const verifyEmail = useCallback(
    async (otp: string) => {
      if (!registerData?.email) {
        throw new Error("Missing register data. Please start register again.");
      }
      const payload: VerifyEmailPayload = { ...registerData, otp };
      const res = await AuthAPI.verifyEmail(payload);
      const body = res.data as ApiEnvelope<{ userId: number; message: string }>;
      setRegisterData(null);
      return body.data;
    },
    [registerData],
  );

  const resendOtp = useCallback(async () => {
    if (!registerData?.email) throw new Error("Missing email to resend OTP.");
    await AuthAPI.resendOtp(registerData.email);
  }, [registerData]);

  const login = useCallback(
    async (data: LoginPayload) => {
      const res = await AuthAPI.login(data);
      const token = res.data?.data?.accessToken;
      if (!token) throw new Error("Thiếu accessToken từ BE");

      setAccessToken(token);

      const p = decodeJwt(token) ?? {};
      const idRaw = p.userId ?? p.id ?? p.sub ?? "";
      const emailRaw = p.email ?? p.sub;
      const nameRaw = p.username ?? p.fullName;
      const avatarRaw = p.avatarUrl;
      const roleRaw = Array.isArray(p.roles) ? p.roles[0] : p.role;

      const u: User = {
        id: idRaw,
        ...(emailRaw ? { email: emailRaw } : {}),
        ...(nameRaw ? { name: nameRaw } : {}),
        ...(avatarRaw ? { avatarUrl: avatarRaw } : {}),
        ...(roleRaw ? { role: roleRaw } : {}),
      };

      setUser(u);
      persistSession(token, u);
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    AuthAPI.logout().catch((e) => {
      // log nhẹ, không chặn logout local
      console.debug("logout error:", e);
    });
    setAccessToken(null);
    setRegisterData(null);
    setUser(null);
    persistSession(null, null);
  }, [persistSession]);

  const forgotPasswordStart = useCallback(async (email: string) => {
    await AuthAPI.forgotPasswordStart({ email });
  }, []);

  const forgotPasswordVerify = useCallback(
    async (args: { email: string; otp: string; newPassword: string; confirmPassword: string }) => {
      await AuthAPI.forgotPasswordVerify(args);
      setAccessToken(null);
      setRegisterData(null);
      setUser(null);
      persistSession(null, null);
    },
    [persistSession],
  );

  const changePassword = useCallback(
    async (data: ChangePasswordPayload) => {
      if (!accessToken) throw new Error("Chưa đăng nhập");
      await AuthAPI.changePassword(data, accessToken);
      setAccessToken(null);
      setRegisterData(null);
      setUser(null);
      persistSession(null, null);
    },
    [accessToken, persistSession],
  );

  /* ===== Context value ===== */

  const value = useMemo(
    () => ({
      accessToken,
      user,
      registerData,
      startRegister,
      verifyEmail,
      resendOtp,
      login,
      logout,
      forgotPasswordStart,
      forgotPasswordVerify,
      changePassword,
      setRegisterData,
      setUser,
      isAuthenticated: !!accessToken,
    }),
    [
      accessToken,
      user,
      registerData,
      startRegister,
      verifyEmail,
      resendOtp,
      login,
      logout,
      forgotPasswordStart,
      forgotPasswordVerify,
      changePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
