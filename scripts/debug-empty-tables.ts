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
    console.log("Testing getTables with potentially empty data...");

    // 1. Get Food Court
    const foodCourt = await prisma.foodCourt.findUnique({ where: { slug: "demo" } });
    if (!foodCourt) {
        console.log("No demo food court.");
        return;
    }

    console.log(`Food Court ID: ${foodCourt.id}`);

    // 2. Simulate logic from getTables action
    // Get tables
    const { data: tables, error } = await supabase
        .from("tables")
        .select("*")
        .eq("food_court_id", foodCourt.id)
        .order("label", { ascending: true });

    if (error) {
        console.error("Supabase Error:", error);
    } else {
        console.log("Tables found:", tables?.length);
        console.log("Tables data:", tables);
    }

    if (!tables || tables.length === 0) {
        console.log("Result is effectively empty array []");
    }
}

main().finally(() => prisma.$disconnect());
