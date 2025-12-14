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
    console.log("Testing Create Table Action Logic...");

    // 1. Get Food Court
    const foodCourt = await prisma.foodCourt.findUnique({ where: { slug: "demo" } });
    if (!foodCourt) {
        console.log("No demo food court.");
        return;
    }

    // 2. Try Insert (simulating action)
    console.log(`Attempting to insert table "Z" for FC ${foodCourt.id}...`);
    const { data, error } = await supabase.from("tables").insert({
        food_court_id: foodCourt.id,
        label: "Z",
    }).select();

    if (error) {
        console.error("INSERT FAILED:", error);
    } else {
        console.log("INSERT SUCCESS:", data);
    }
}

main().finally(() => prisma.$disconnect());
