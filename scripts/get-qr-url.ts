import { PrismaClient } from "@prisma/client";
import { generateSignedScanUrl } from "../src/lib/crypto";

const prisma = new PrismaClient();

async function main() {
    // 1. Get or Create Food Court
    let foodCourt = await prisma.foodCourt.findUnique({ where: { slug: "demo" } });
    if (!foodCourt) {
        console.log("Creating default food court...");
        foodCourt = await prisma.foodCourt.create({
            data: { name: "Demo Food Court", slug: "demo" },
        });
    }

    // 2. Get or Create Table
    let table = await prisma.table.findFirst({ where: { food_court_id: foodCourt.id } });
    if (!table) {
        console.log("Creating default table...");
        table = await prisma.table.create({
            data: { label: "1", food_court_id: foodCourt.id }
        });
    }

    // 3. Generate URL
    const baseUrl = "http://localhost:3000";
    const scanPath = `${baseUrl}/eat/${foodCourt.slug}/table/${table.id}`;
    const signedUrl = generateSignedScanUrl(scanPath, table.id);

    console.log("SIGNED_URL:", signedUrl);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
