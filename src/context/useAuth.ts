import { useContext } from "react";
import { AuthContext } from "./AuthContextCore";
import type { AuthContextType } from "./AuthContext";

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
