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
    console.log("Debugging Table Visibility...");

    // 1. Get Food Court
    const foodCourt = await prisma.foodCourt.findUnique({ where: { slug: "demo" } });
    if (!foodCourt) {
        console.log("No demo food court found via Prisma.");
        return;
    }
    console.log("Food Court ID:", foodCourt.id);

    // 2. Fetch via Prisma (Admin)
    const prismaTables = await prisma.table.findMany({ where: { food_court_id: foodCourt.id } });
    console.log("Prisma (Admin) Tables Count:", prismaTables.length);
    prismaTables.forEach(t => console.log(` - [${t.label}] ${t.id}`));

    // 3. Fetch via Supabase (Anon) - Simulating Client
    const { data: anonTables, error } = await supabase
        .from("tables")
        .select("*")
        .eq("food_court_id", foodCourt.id);

    if (error) {
        console.error("Supabase Anon Error:", error);
    } else {
        console.log("Supabase (Anon) Tables Count:", anonTables?.length);
        anonTables?.forEach((t: any) => console.log(` - [${t.label}] ${t.id}`));
    }
}

main().finally(() => prisma.$disconnect());
