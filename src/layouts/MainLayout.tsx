import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SocialFloat from "../components/SocialFloat.tsx";

export default function MainLayout() {
  const { pathname } = useLocation();

  const hideOn = ["/dang-nhap", "/dang-ky", "/quen-mat-khau"];

  const shouldHide = hideOn.some((p) => pathname.startsWith(p));

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      {/* Main */}
      <main className="w-full flex-1">
        <div>
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
    </div>
  );
}
