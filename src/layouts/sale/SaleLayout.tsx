import { Outlet } from "react-router-dom";
import SaleTopbar from "../../components/Sale/SaleTopBar";

export default function SaleLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <SaleTopbar />
            <main className="flex-1 p-4 md:p-6">
                <Outlet />
            </main>
        </div>
    );
}
