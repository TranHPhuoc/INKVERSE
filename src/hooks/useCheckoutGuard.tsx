import { useCallback, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth.ts";
import { listMyAddresses } from "../services/account-address";
import AddressPromptModal from "../components/AddressPromptModal";

export default function useCheckoutGuard(returnTo: string = "/checkout") {
  const { isAuthenticated } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const accountAddressPath = "/tai-khoan/dia-chi";

  const proceedToAddress = useCallback(() => {
    setOpen(false);
    nav(`${accountAddressPath}?return=${encodeURIComponent(returnTo)}`, { replace: false });
  }, [nav, returnTo]);

  const ensureReady = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      const wanting = returnTo || loc.pathname || "/checkout";
      nav(`/dang-nhap?next=${encodeURIComponent(wanting)}`, { replace: false });
      return false;
    }

    try {
      const addrs = await listMyAddresses();
      if (!addrs || addrs.length === 0) {
        setOpen(true);
        return false;
      }
    } catch {
      setOpen(true);
      return false;
    }

    return true;
  }, [isAuthenticated, nav, loc.pathname, returnTo]);

  const modal = useMemo(
    () => (
      <AddressPromptModal
        open={open}
        onClose={() => setOpen(false)}
        onProceed={proceedToAddress}
      />
    ),
    [open, proceedToAddress],
  );

  return { ensureReady, modal };
}
