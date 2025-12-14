
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
    console.log("Enabling Realtime for Cart Tables...");
    try {
        // Create publication if it doesn't exist (it usually does in Supabase)
        // But we just need to add tables.
        await prisma.$executeRawUnsafe(`
        ALTER PUBLICATION supabase_realtime ADD TABLE cart_sessions, cart_items;
      `);
        console.log("Success: Added cart_sessions and cart_items to supabase_realtime Publication.");
    } catch (e: any) {
        if (e.message.includes("already in publication")) {
            console.log("Tables already in publication.");
        } else {
            console.error("Failed to enable realtime:", e);
        }
    }
}

main().finally(() => prisma.$disconnect());
