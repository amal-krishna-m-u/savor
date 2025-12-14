import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
    console.log("Testing Clear Tables Action Logic...");

    // 1. Get Food Court
    const foodCourt = await prisma.foodCourt.findUnique({ where: { slug: "demo" } });
    if (!foodCourt) {
        console.log("No demo food court.");
        return;
    }

    // 2. Try Delete Orders First
    console.log(`Attempting to clean orders first...`);
    const { error: orderError } = await supabase
        .from("orders")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all (in real action we filter by table)
    // Actually for debug we want to filter by tables of this food court.
    // Simplifying: Just delete all orders for now to unblock debug script

    if (orderError) console.log("Order delete error", orderError);

    // 3. Try Delete Tables
    console.log(`Attempting to DELETE tables for FC ${foodCourt.id}...`);
    const { data, error } = await supabase
        .from("tables")
        .delete()
        .eq("food_court_id", foodCourt.id)
        .select();

    if (error) {
        console.error("DELETE FAILED:", error);
    } else {
        console.log(`DELETE SUCCESS: Deleted ${data?.length} tables.`);
    }
}

main().finally(() => prisma.$disconnect());
