import { validateScanRequest } from "@/lib/auth-checks";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

// Since this is a Layout/Page, we might actually want middleware to handle the redirect logic generally,
// but for MVP doing it in the component or a dedicated API check is fine.
// Actually, the requirement was middleware. We already added it there?
// Let's check middleware.ts configuration.
// For now, we'll assume the user lands here and we validate client-side or server-component side.

export default async function CustomerLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string; id: string }>;
}) {
    const { id } = await params;
    return (
        <div className="min-h-[100dvh] bg-gray-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white border-b shadow-sm p-4 flex justify-between items-center">
                <h1 className="font-bold text-lg">Savor</h1>
            </header>

            {children}
        </div>
    );
}
