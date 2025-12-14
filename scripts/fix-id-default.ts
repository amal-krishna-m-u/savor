import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Fixing ID defaults...");

    const tables = ["orders", "tables", "restaurants", "menu_items", "categories", "food_courts"];

    try {
        for (const table of tables) {
            console.log(`Altering ${table}...`);
            try {
                await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ALTER COLUMN id SET DEFAULT gen_random_uuid();`);
            } catch (e) {
                console.log(`Failed for ${table} (might already allow default?):`, e);
            }
        }
        console.log("Defaults applied!");
    } catch (e) {
        console.error("Error applying defaults:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
