import { MenuForm } from "@/components/dashboard/menu-form";

export default function NewMenuPage() {
    return (
        <div className="p-8 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Add New Item</h2>
            <div className="p-6 border rounded-md">
                <MenuForm />
            </div>
        </div>
    );
}
