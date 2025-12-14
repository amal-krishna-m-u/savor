import { AppSidebar, MobileSidebar } from "@/components/dashboard/app-sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-80 bg-gray-900">
                <AppSidebar />
            </div>
            <main className="md:pl-72 pb-10">
                <div className="flex items-center p-4 md:hidden border-b">
                    <MobileSidebar />
                    <span className="font-bold ml-4">Savor Admin</span>
                </div>
                {children}
            </main>
        </div>
    );
}
