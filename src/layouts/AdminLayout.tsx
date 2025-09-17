import { Outlet } from "react-router-dom";
import PageTransition from "../components/Animation/PageTransition";
import Sidebar from "../components/admin/Sidebar";
import Topbar from "../components/admin/Topbar";

export default function AdminLayout() {
    return (
        <div className="relative min-h-screen overflow-x-hidden">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200" />
                <div className="absolute -top-24 -left-24 h-[28rem] w-[28rem] rounded-full bg-indigo-200/30 blur-3xl" />
                <div className="absolute top-1/3 -right-24 h-[24rem] w-[24rem] rounded-full bg-fuchsia-200/30 blur-3xl" />
                <div className="absolute bottom-0 left-1/3 h-[18rem] w-[18rem] rounded-full bg-teal-200/30 blur-3xl" />
            </div>

            <div className="flex">
                <Sidebar />

                <div className="flex-1 flex flex-col">
                    <Topbar />

                    <main className="px-4 py-6 md:px-6 lg:px-8">
                        <div className="mx-auto max-w-9xl">
                            <div className="rounded-2xl border bg-white/80 backdrop-blur shadow-sm">
                                <div className="p-5 md:p-6 lg:p-8">
                                    <PageTransition>
                                        <Outlet />
                                    </PageTransition>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
