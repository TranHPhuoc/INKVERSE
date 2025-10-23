import { Outlet } from "react-router-dom";
import SaleTopbar from "../../components/Sale/SaleTopBar";
import ChatBoxWidget from "../../components/ChatBoxWidget";
import aiIcon from "../../assets/aiagentchat.png";

export default function SaleLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <SaleTopbar />
            <main className="flex-1 p-4 md:p-6">
                <Outlet />
            </main>
          <ChatBoxWidget mode="SALE" avatarSrc={aiIcon} />
        </div>
    );
}
