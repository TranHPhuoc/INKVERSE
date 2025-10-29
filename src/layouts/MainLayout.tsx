// src/layouts/MainLayout.tsx
import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SocialFloat from "../components/SocialFloat";
import ChatBoxWidget from "../components/ChatBoxWidget";
import aiIcon from "../assets/aiagentchat.png";

export default function MainLayout() {
  const { pathname } = useLocation();
  const hideOn = ["/dang-nhap", "/dang-ky", "/quen-mat-khau"];
  const shouldHide = hideOn.some((p) => pathname.startsWith(p));

  // theo dõi scroll để đổi nền/bóng của header
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ➜ ĐO CHIỀU CAO HEADER THỰC TẾ
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerH, setHeaderH] = useState(56); // fallback 56px

  const measure = () => {
    const h = headerRef.current?.offsetHeight ?? 56;
    setHeaderH(h);
    // publish cho nơi khác nếu cần
    document.documentElement.style.setProperty("--header-h", `${h}px`);
  };

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (headerRef.current) ro.observe(headerRef.current);
    window.addEventListener("orientationchange", measure);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* HEADER cố định */}
      <div
        ref={headerRef}
        className={[
          "fixed inset-x-0 top-0 z-50",
          scrolled
            ? "bg-white/85 backdrop-blur-xl ring-1 ring-slate-200/70 shadow-[0_10px_24px_-18px_rgba(2,6,23,.35)]"
            : "bg-white/65 backdrop-blur supports-[backdrop-filter]:bg-white/55",
        ].join(" ")}
      >
        <Header />
      </div>

      {/* SPACER đẩy nội dung xuống đúng bằng chiều cao header */}
      <div style={{ height: headerH }} />

      <main className="w-full flex-1">
        <div className="relative z-0">
          <Outlet />
        </div>
      </main>

      <Footer />

      {!shouldHide && (
        <SocialFloat
          zaloLink="https://zalo.me/0335863953"
          phoneNumber="0335863953"
          messengerLink="https://www.facebook.com/phuoc.tranhuu.14418101"
        />
      )}

      <ChatBoxWidget mode="USER" avatarSrc={aiIcon} />
    </div>
  );
}
