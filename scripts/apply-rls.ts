import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Applying RLS policies...");

    try {
        // 1. Enable RLS on tables
        await prisma.$executeRawUnsafe(`ALTER TABLE "tables" ENABLE ROW LEVEL SECURITY;`);

        // 2. Drop existing policies if any to avoid conflict (optional, but safe)
        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Tables are viewable by everyone" ON "tables";`);
        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Admins can insert tables" ON "tables";`);
        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Admins can delete tables" ON "tables";`);
        await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Anyone can create food courts" ON "food_courts";`);

        // 3. Create Public Read Policy
        await prisma.$executeRawUnsafe(`
      CREATE POLICY "Tables are viewable by everyone" 
      ON "tables" FOR SELECT 
      USING (true);
    `);

        // NEW: Allow creating food courts for the demo
        await prisma.$executeRawUnsafe(`
      CREATE POLICY "Anyone can create food courts" 
      ON "food_courts" FOR INSERT 
      WITH CHECK (true);
    `);

        // 4. Create Insert/Delete Policies (Relaxed for MVP)
        await prisma.$executeRawUnsafe(`
      CREATE POLICY "Admins can insert tables" 
      ON "tables" FOR INSERT 
      WITH CHECK (true);
    `);

        await prisma.$executeRawUnsafe(`
      CREATE POLICY "Admins can delete tables" 
      ON "tables" FOR DELETE 
      USING (true);
    `);

        console.log("RLS Policies applied successfully!");
    } catch (e) {
        console.error("Error applying policies:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
