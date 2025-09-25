import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export function useRequireAuth() {
  const { isAuthenticated } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  return <T extends (...args: any[]) => void>(cb: T) => {
    if (isAuthenticated) return cb();
    nav("/dang-nhap", { state: { returnTo: loc.pathname + loc.search } });
  };
}
