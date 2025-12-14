import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { generateSignedScanUrl } from "../src/lib/crypto";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
    console.log("Generating Valid Scan URL...");

    // 1. Get Food Court
    const foodCourt = await prisma.foodCourt.findUnique({ where: { slug: "demo" } });
    if (!foodCourt) {
        console.log("No demo food court.");
        return;
    }

    // 2. Insert a specific table for testing if not exists
    let table = await prisma.table.findFirst({ where: { label: "ScanTest", food_court_id: foodCourt.id } });
    if (!table) {
        table = await prisma.table.create({
            data: {
                food_court_id: foodCourt.id,
                label: "ScanTest",
            }
        });
    }

    // 3. Generate URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const scanPath = `${baseUrl}/eat/${foodCourt.slug}/table/${table.id}`;
    const signedUrl = generateSignedScanUrl(scanPath, table.id);

    console.log("SCAN_URL=" + signedUrl);
}

main().finally(() => prisma.$disconnect());
