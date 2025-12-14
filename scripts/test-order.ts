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
    console.log("Testing Order Insertion via Anon Client...");

    // 1. Get Setup Data (Table & Restaurant)
    const table = await prisma.table.findFirst();
    let restaurant = await prisma.restaurant.findFirst();

    if (!restaurant && table) {
        console.log("Creating default restaurant...");
        restaurant = await prisma.restaurant.create({
            data: {
                name: "Demo Restaurant",
                food_court_id: table.food_court_id,
                is_active: true
            }
        });
    }

    if (!table || !restaurant) {
        console.error("Missing table or restaurant!", { table, restaurant });
        return;
    }

    // 2. Try Insert
    const { data, error } = await supabase
        .from("orders")
        .insert({
            table_id: table.id,
            restaurant_id: restaurant.id,
            total_amount: 25.00,
            items: [{ name: "Test Item", price: 25.00, quantity: 1 }],
            status: "pending",
            payment_status: "unpaid"
        })
        .select()
        .single();

    if (error) {
        console.error("FAILED Order Insert:", error);
    } else {
        console.log("SUCCESS Order Insert:", data);
    }
}

main().finally(() => prisma.$disconnect());
