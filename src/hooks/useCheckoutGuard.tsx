// src/hooks/useCheckoutGuard.tsx
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listMyAddresses } from "../services/account-address";
import AddressPromptModal from "../components/AddressPromptModal";

/**
 * Guard dùng cho:
 *  - nút "Mua ngay" (ProductDetailsPage)
 *  - nút "Tiến hành đặt hàng" (CartPage)
 *
 * Logic:
 *  1) Chưa login  -> điều hướng /dang-nhap?next=<returnTo>
 *  2) Đã login nhưng CHƯA có địa chỉ -> mở modal → đi /tai-khoan/dia-chi?return=<returnTo>
 *  3) Ok hết       -> resolve true để caller điều hướng sang returnTo (mặc định /checkout)
 */
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
        // 1) chưa đăng nhập -> đưa qua login, nhớ next
        if (!isAuthenticated) {
            const wanting = returnTo || loc.pathname || "/checkout";
            nav(`/dang-nhap?next=${encodeURIComponent(wanting)}`, { replace: false });
            return false;
        }

        // 2) đã login -> check có địa chỉ chưa
        try {
            const addrs = await listMyAddresses();
            if (!addrs || addrs.length === 0) {
                setOpen(true); // mở modal nhắc bổ sung địa chỉ
                return false;
            }
        } catch {
            // lỗi API -> coi như chưa có địa chỉ
            setOpen(true);
            return false;
        }

        // 3) ok
        return true;
    }, [isAuthenticated, nav, loc.pathname, returnTo]);

    // Modal (không render gì khi open=false)
    const modal = useMemo(
        () => (
            <AddressPromptModal
                open={open}
                onClose={() => setOpen(false)}
                onProceed={proceedToAddress}
            />
        ),
        [open, proceedToAddress]
    );

    return { ensureReady, modal };
}
