import { createClient } from "@/utils/supabase/server";
import { CustomerMenuView } from "@/components/customer/menu-view";

export default async function CustomerMenuPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
    const { slug, id } = await params;

    // Fetch Table Info for display
    const supabase = await createClient();
    const { data: table } = await supabase
        .from("tables")
        .select("id, label, food_court_id")
        .eq("id", id)
        .single();

    console.log("Debug: Table fetched:", table);

    if (!table) return <div>Table not found</div>;

    // Fetch Menu for this Food Court
    const { data: restaurants, error: rError } = await supabase
        .from("restaurants")
        .select(`
            id, 
            name, 
            menu_items (
                id,
                name,
                description,
                price,
                category_id,
                image_url
            )
        `)
        .eq("food_court_id", table.food_court_id)
        .eq("is_active", true);

    console.log("Debug: Restaurants fetched:", restaurants?.length, rError);

    // Flatten and Format
    const menuItems = restaurants?.flatMap(r =>
        r.menu_items.map(item => ({
            id: item.id,
            name: item.name,
            price: Number(item.price), // Decimal to Number
            description: item.description || "",
            restaurantId: r.id,
            restaurantName: r.name,
            category: "Mains", // TODO: Fetch category name if needed
            image_url: item.image_url
        }))
    ) || [];

    return <CustomerMenuView tableId={id} tableLabel={table?.label || ""} initialMenuItems={menuItems} />;
}
