import { Routes, Route, Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

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
import OrderDetailPage from "./pages/OrderDetailPage";
import OrderListPage from "./pages/OrderListPage";
import CheckoutPage from "./pages/CheckoutPage";
import AccountAddressPage from "./pages/AccountAddressPage";

import ScrollToTop from "./components/ScrollToTop.tsx";
import ProtectedRoute from "./routes/ProtectedRoute";
import Dashboard from "./pages/admin/Dashboard";
import BooksPage from "./pages/admin/BooksPage";
import UserPage from "./pages/admin/UserPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import MasterPage from "./pages/admin/MasterPage";

function LoginGuard({ children }: { children: ReactNode }) {
    try {
        const raw = localStorage.getItem("auth.user");
        if (raw) {
            const u = JSON.parse(raw) as { role?: string; roles?: string[] };
            const roles = new Set([u.role, ...(u.roles ?? [])].filter(Boolean) as string[]);
            if (roles.has("ROLE_ADMIN") || roles.has("ADMIN")) return <Navigate to="/admin" replace />;
        }
    } catch {/**/}
    return <>{children}</>;
}

export default function App() {
    return (
        <>
            <ScrollToTop />
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/dang-ky" element={<RegisterPage />} />
                    <Route
                        path="/dang-nhap"
                        element={
                            <LoginGuard>
                                <LoginPage />
                            </LoginGuard>
                        }
                    />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                    <Route path="/quen-mat-khau" element={<ForgotStartPage />} />
                    <Route path="/dat-lai-mat-khau" element={<ForgotVerifyPage />} />
                    <Route path="/doi-mat-khau" element={<ChangePasswordPage />} />

                    <Route path="/books/:bookSlug" element={<ProductDetailsPage />} />
                    <Route path="/danh-muc/:catSlug/:bookSlug" element={<ProductDetailsPage />} />
                    <Route path="/danh-muc/:catSlug" element={<CategoryPage />} />
                    <Route path="/search" element={<SearchPage />} />

                    <Route path="/gio-hang" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />                 {/* 👈 thêm */}
                    <Route path="/tai-khoan/dia-chi" element={<AccountAddressPage />} />  {/* 👈 thêm */}
                    <Route path="/tai-khoan" element={<Navigate to="/tai-khoan/dia-chi" replace />} />

                    <Route path="/orders/:code" element={<OrderDetailPage />} />
                    <Route path="/don-hang" element={<OrderListPage />} />
                </Route>

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Dashboard />} />
                    <Route path="books" element={<BooksPage />} />
                    <Route path="users" element={<UserPage />} />
                    <Route path="categories" element={<CategoriesPage />} />
                    <Route path="masters" element={<MasterPage />} />
                </Route>

                <Route path="*" element={<div style={{padding:24}}>404 – Không khớp route</div>} />

            </Routes>
        </>
    );
}
