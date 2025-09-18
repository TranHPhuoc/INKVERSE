import { useState, useCallback } from "react";

export default function useCartToast() {
    const [open, setOpen] = useState(false);
    const [text, setText] = useState("Đã thêm vào giỏ hàng!");
    const show = useCallback((msg?: string) => {
        if (msg) setText(msg);
        setOpen(true);
    }, []);
    const hide = useCallback(() => setOpen(false), []);
    return { open, text, show, hide };
}
