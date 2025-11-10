import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./context/useAuth";
import { configureFavoritesForUser, preloadFavoritesFromServer } from "./store/favorite-store";
import PaymentReturnPage from "./pages/PaymentReturnPage";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import SaleLayout from "./layouts/sale/SaleLayout";

// Components
import ScrollToTop from "./components/ScrollToTop";
import PageTransition from "./components/Animation/PageTransition";
import ProtectedRoute from "./routes/ProtectedRoute";
import Intro from "./components/Animation/Intro";
import { Toaster } from "react-hot-toast";



// Pages – Public
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotStartPage from "./pages/ForgotStartPage";
import ForgotVerifyPage from "./pages/ForgotVerifyPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import CategoryPage from "./pages/CategoryPage";
import SearchPage from "./pages/SearchPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import OrderListPage from "./pages/OrderListPage";
import PurchaseHistoryPage from "./pages/PurchaseHistoryPage";
import FavoritesPage from "./pages/FavoritePage.tsx";
import RelatedAllPage from "./pages/RelatedAllPage";
import VNPayReturnPage from "./pages/VNPayReturnPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import AuthorDetailPage from "./pages/AuthorDetailPage";
import TopSellingAllPage from "./pages/TopSellingAllPage";
import ContactUs from "@/pages/ContactUs.tsx";


// Pages – User
import AccountLayout from "./pages/user/AccountLayout";
import AccountAddressPage from "./pages/user/AccountAddressPage";
import AccountProfilePage from "./pages/user/AccountProfilePage";
import AccountChangePasswordPage from "./pages/user/AccountChangePasswordPage";

// Pages – Admin
import Dashboard from "./pages/admin/Dashboard";
import BooksPage from "./pages/admin/BooksPage";
import UserPage from "./pages/admin/UserPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import MasterPage from "./pages/admin/MasterPage";
import StocksPage from "./pages/admin/StocksPage.tsx";
import NewBatchPage from "./pages/admin/NewBatchPage";
import BatchHistoryPage from "./pages/admin/BatchHistoryPage.tsx";
import SalesPage from "@/pages/admin/SalesPage.tsx";

// Pages – Sale
import SaleOrdersPage from "./pages/sale/SaleOrderPage";
import SaleOrderDetailPage from "./pages/sale/SaleOrderDetailPage";


function useVnpBootstrap() {
  const nav = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/") return;

    const search = location.search || "";
    if (!search.includes("vnp_")) return;

    nav(`/payment/vnpay/return${search}`, { replace: true });
  }, [location.pathname, location.search, nav]);
}

/* ───────────────────────── Guards ───────────────────────── */
function LoginGuard({ children }: { children: ReactNode }) {
  try {
    const raw = localStorage.getItem("auth.user");
    if (raw) {
      const u = JSON.parse(raw) as { role?: string; roles?: string[] };
      const roles = new Set([u.role, ...(u.roles ?? [])].filter(Boolean) as string[]);
      if (roles.has("ROLE_ADMIN") || roles.has("ADMIN")) {
        return <Navigate to="/admin" replace />;
      }
      if (roles.has("ROLE_SALE") || roles.has("SALE")) {
        return <Navigate to="/sale/orders" replace />;
      }
    }
  } catch {
    /* ignore */
  }
  return <>{children}</>;
}

/* ───────────────────────── Intro Gate ───────────────────────── */
function IntroGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // khai báo Hooks LUÔN nằm trước mọi return
  const [skipped, setSkipped] = useState(false);
  const isHome = location.pathname === "/";

  const shouldSkip = useMemo(() => {
    const q = new URLSearchParams(location.search);
    const fromQuery = q.get("skipIntro") === "1";
    const fromSession = sessionStorage.getItem("intro.skip.once") === "1";
    return fromQuery || fromSession;
  }, [location.search]);

  useEffect(() => {
    if (shouldSkip) {
      sessionStorage.removeItem("intro.skip.once");
      setSkipped(true);
    }
  }, [shouldSkip]);

  // 🚀 Nếu đã đăng nhập thì bỏ qua Intro
  if (isAuthenticated) return <>{children}</>;

  const showIntro = isHome && !skipped;

  if (showIntro) {
    return (
      <>
        <Intro
          title="Chào mừng bạn đến với INKVERSE"
          ctaLabel="Khám phá ngay"
          to="/"
          onlyOnce={true}
        />
        {children}
      </>
    );
  }

  return <>{children}</>;
}

/* ───────────────────────── Main App ───────────────────────── */
export default function App() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  useVnpBootstrap();

  useEffect(() => {
    configureFavoritesForUser(isAuthenticated ? user?.id : null);
    preloadFavoritesFromServer().catch(() => {});
  }, [isAuthenticated, user?.id]);

  return (
    <>
      <ScrollToTop />
      <IntroGate>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* PUBLIC */}
            <Route element={<MainLayout />}>
              <Route
                path="/"
                element={
                  <PageTransition>
                    <HomePage />
                  </PageTransition>
                }
              />
              <Route
                path="/payment/vnpay/return"
                element={
                  <PageTransition>
                    <PaymentReturnPage />
                  </PageTransition>
                }
              />
              <Route
                path="/dang-ky"
                element={
                  <PageTransition>
                    <RegisterPage />
                  </PageTransition>
                }
              />
              <Route
                path="/dang-nhap"
                element={
                  <LoginGuard>
                    <PageTransition>
                      <LoginPage />
                    </PageTransition>
                  </LoginGuard>
                }
              />
              <Route
                path="/verify-email"
                element={
                  <PageTransition>
                    <VerifyEmailPage />
                  </PageTransition>
                }
              />
              <Route
                path="/quen-mat-khau"
                element={
                  <PageTransition>
                    <ForgotStartPage />
                  </PageTransition>
                }
              />
              <Route
                path="/dat-lai-mat-khau"
                element={
                  <PageTransition>
                    <ForgotVerifyPage />
                  </PageTransition>
                }
              />
              <Route
                path="/doi-mat-khau"
                element={
                  <PageTransition>
                    <ChangePasswordPage />
                  </PageTransition>
                }
              />
              <Route
                path="/lien-he"
                element={
                  <PageTransition>
                    <ContactUs />
                  </PageTransition>
                }
              />

              {/* Products */}
              <Route
                path="/books/:bookSlug"
                element={
                  <PageTransition>
                    <ProductDetailsPage />
                  </PageTransition>
                }
              />
              <Route
                path="/danh-muc/:catSlug/:bookSlug"
                element={
                  <PageTransition>
                    <ProductDetailsPage />
                  </PageTransition>
                }
              />
              <Route
                path="/danh-muc/:catSlug"
                element={
                  <PageTransition>
                    <CategoryPage />
                  </PageTransition>
                }
              />
              <Route
                path="/top-selling"
                element={
                  <PageTransition>
                    <TopSellingAllPage />
                  </PageTransition>
                }
              />
              <Route
                path="/search"
                element={
                  <PageTransition>
                    <SearchPage />
                  </PageTransition>
                }
              />


              {/* Cart / Orders */}
              <Route
                path="/gio-hang"
                element={
                  <PageTransition>
                    <CartPage />
                  </PageTransition>
                }
              />
              <Route
                path="/checkout"
                element={
                  <PageTransition>
                    <CheckoutPage />
                  </PageTransition>
                }
              />
              <Route
                path="/orders/:code"
                element={
                  <PageTransition>
                    <OrderDetailPage />
                  </PageTransition>
                }
              />
              <Route
                path="/order-success"
                element={
                  <PageTransition>
                    <OrderSuccessPage />
                  </PageTransition>
                }
              />
              <Route path="/lich-su-mua-hang"
                     element={
                       <PageTransition>
                         <PurchaseHistoryPage />
                       </PageTransition>
                     }
              />

              <Route
                path="/don-hang"
                element={
                  <PageTransition>
                    <OrderListPage />
                  </PageTransition>
                }
              />
              <Route
                path="/yeu-thich"
                element={
                  <PageTransition>
                    <FavoritesPage />
                  </PageTransition>
                }
              />
              <Route
                path="/goi-y/:bookId"
                element={
                  <PageTransition>
                    <RelatedAllPage />
                  </PageTransition>
                }
              />
              <Route
                path="/checkout/return"
                element={
                  <PageTransition>
                    <VNPayReturnPage />
                  </PageTransition>
                }
              />
              <Route
                path="/author/:slug"
                element={
                  <PageTransition>
                    <AuthorDetailPage />
                  </PageTransition>
                }
              />

              {/* USER */}
              <Route
                path="/tai-khoan"
                element={
                  <PageTransition>
                    <AccountLayout />
                  </PageTransition>
                }
              >
                <Route index element={<Navigate to="ho-so-cua-toi" replace />} />
                <Route
                  path="ho-so-cua-toi"
                  element={
                    <PageTransition>
                      <AccountProfilePage />
                    </PageTransition>
                  }
                />
                <Route
                  path="dia-chi"
                  element={
                    <PageTransition>
                      <AccountAddressPage />
                    </PageTransition>
                  }
                />
                <Route
                  path="doi-mat-khau"
                  element={
                    <PageTransition>
                      <AccountChangePasswordPage />
                    </PageTransition>
                  }
                />
              </Route>
            </Route>

            {/* ADMIN */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["ADMIN", "ROLE_ADMIN"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <PageTransition>
                    <Dashboard />
                  </PageTransition>
                }
              />
              <Route
                path="books"
                element={
                  <PageTransition>
                    <BooksPage />
                  </PageTransition>
                }
              />
              <Route
                path="users"
                element={
                  <PageTransition>
                    <UserPage />
                  </PageTransition>
                }
              />
              <Route
                path="sales"
                element={
                  <PageTransition>
                    <SalesPage />
                  </PageTransition>
                }
              />
              <Route
                path="categories"
                element={
                  <PageTransition>
                    <CategoriesPage />
                  </PageTransition>
                }
              />
              <Route
                path="masters"
                element={
                  <PageTransition>
                    <MasterPage />
                  </PageTransition>
                }
              />
              <Route
                path="warehouse/stocks"
                element={
                  <PageTransition>
                    <StocksPage />
                  </PageTransition>
                }
              />
              <Route
                path="warehouse/batches/new"
                element={
                  <PageTransition>
                    <NewBatchPage />
                  </PageTransition>
                }
              />
              <Route
                path="warehouse/batches"
                element={
                  <PageTransition>
                    <BatchHistoryPage />
                  </PageTransition>
                }
              />
            </Route>

            {/* SALE */}
            <Route
              path="/sale"
              element={
                <ProtectedRoute roles={["SALE", "ROLE_SALE", "ADMIN", "ROLE_ADMIN"]}>
                  <SaleLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="orders" replace />} />
              <Route
                path="orders"
                element={
                  <PageTransition>
                    <SaleOrdersPage />
                  </PageTransition>
                }
              />
              <Route
                path="orders/:id"
                element={
                  <PageTransition>
                    <SaleOrderDetailPage />
                  </PageTransition>
                }
              />
            </Route>

            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <PageTransition>
                  <div className="p-10 text-center text-gray-600">404 – Không tìm thấy trang</div>
                </PageTransition>
              }
            />
          </Routes>
        </AnimatePresence>
      </IntroGate>
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}
