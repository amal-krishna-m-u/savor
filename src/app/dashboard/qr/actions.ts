"use server";

import { createClient } from "@/utils/supabase/server";
import { generateSignedScanUrl } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

export type TableWithQR = {
    id: string;
    label: string;
    qrCodeUrl: string;
};

// Fetch all food courts
export async function getFoodCourts() {
    const supabase = await createClient();
    const { data } = await supabase.from("food_courts").select("id, name, slug").order("name");
    return data || [];
}

// Fetch all tables for a specific food court
export async function getTables(foodCourtId: string): Promise<TableWithQR[]> {
    const supabase = await createClient();
    if (!foodCourtId) return [];

    // Get food court info for URL generation
    const { data: foodCourt } = await supabase
        .from("food_courts")
        .select("slug")
        .eq("id", foodCourtId)
        .single();

    if (!foodCourt) return [];

    // 2. Get tables
    const { data: tables } = await supabase
        .from("tables")
        .select("id, label, food_court_id") // Explicit select
        .eq("food_court_id", foodCourtId)
        .order("label", { ascending: true });

    if (!tables) return [];

    // 3. Generate Signed URLs
    // Ensure we use the Environment Variable, fallback to localhost only if missing
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
        console.warn("NEXT_PUBLIC_APP_URL not set, falling back to localhost");
        baseUrl = "http://localhost:3000";
    }
    // Remove trailing slash if present
    baseUrl = baseUrl.replace(/\/$/, "");

    console.log("Generating QR codes with Base URL:", baseUrl);

    return tables.map((table) => {
        const scanPath = `${baseUrl}/eat/${foodCourt.slug}/table/${table.id}`;
        const signedUrl = generateSignedScanUrl(scanPath, table.id);

        return {
            id: table.id,
            label: table.label,
            qrCodeUrl: signedUrl,
        };
    });
}

// Create a specific table
// Create a specific table
export async function createTable(foodCourtId: string, label: string) {
    console.log("createTable Action Started:", foodCourtId, label);
    try {
        const supabase = await createClient();

        // Check if label exists for this food court
        const { data: existing, error: fetchError } = await supabase
            .from("tables")
            .select("id")
            .eq("food_court_id", foodCourtId)
            .eq("label", label)
            .maybeSingle();

        if (fetchError) {
            console.error("Fetch Table Error:", fetchError);
            throw new Error("Database error while checking table.");
        }

        if (existing) {
            throw new Error(`Table ${label} already exists.`);
        }

        const { error } = await supabase.from("tables").insert({
            food_court_id: foodCourtId,
            label: label,
        });

        if (error) {
            console.error("Create Table Error:", error);
            if (error.code === '23505') {
                throw new Error(`Table ${label} already exists.`);
            }
            throw new Error("Failed to create table: " + error.message);
        }

        revalidatePath("/dashboard/qr");
    } catch (e: any) {
        // Log the full error on server
        console.error("Server Action 'createTable' failed:", e);
        // Re-throw with clean message for client
        throw new Error(e.message || "Failed to create table.");
    }
}


// Bulk Create with specific start label
export async function bulkCreateTables(foodCourtId: string, startLabel: string, count: number) {
    const supabase = await createClient();

    // Parse start label to integer
    let startNum = parseInt(startLabel, 10);
    if (isNaN(startNum)) {
        throw new Error("Start Label must be a number for bulk generation.");
    }

    const newTables = Array.from({ length: count }).map((_, i) => ({
        food_court_id: foodCourtId,
        label: `${startNum + i}`,
    }));

    // Use upsert to skip valid duplicates or error?
    // User requirement: "Generate bulk QR". Simple insert is better, let it fail on duplicate label constraint if any.
    // Or we filter out existing.

    // Check for collisions first? 
    // Simplified: Just try to insert. Postgres will error if unique constraint on (food_court_id, label) exists.
    // However, schema might not have unique constraint there? It should.

    const { error } = await supabase.from("tables").insert(newTables);

    if (error) {
        console.error("Bulk Create Error:", error);
        if (error.code === '23505') { // Unique violation
            throw new Error("Some tables already exist with these labels.");
        }
        throw new Error("Failed to create tables: " + error.message);
    }

    revalidatePath("/dashboard/qr");
}

// Delete single table
export async function deleteTable(tableId: string) {
    const supabase = await createClient();

    // Delete linked orders first? Assuming Cascade Delete is standard on DB or we handle it manually.
    // In clearTables we handled manual delete. Let's do same here for safety.
    await supabase.from("orders").delete().eq("table_id", tableId); // Ignore error if clean

    const { error } = await supabase.from("tables").delete().eq("id", tableId);
    if (error) {
        throw new Error("Failed to delete table: " + error.message);
    }
    revalidatePath("/dashboard/qr");
}

// Bulk Delete specific IDs
export async function deleteTables(tableIds: string[]) {
    const supabase = await createClient();

    // Cleanup orders
    await supabase.from("orders").delete().in("table_id", tableIds);

    const { error } = await supabase.from("tables").delete().in("id", tableIds);
    if (error) {
        throw new Error("Failed to delete tables: " + error.message);
    }
    revalidatePath("/dashboard/qr");
}

export async function clearTables(foodCourtId: string) {
    const supabase = await createClient();
    if (foodCourtId) {
        // 1. Get all table IDs for this food court to clean orders
        const { data: tables } = await supabase
            .from("tables")
            .select("id")
            .eq("food_court_id", foodCourtId);

        if (tables && tables.length > 0) {
            const tableIds = tables.map(t => t.id);

            // 2. Delete linked orders first
            await supabase.from("orders").delete().in("table_id", tableIds);

            // 3. Now delete tables
            const { error } = await supabase.from("tables").delete().eq("food_court_id", foodCourtId);

            if (error) {
                console.error("Clear Tables Error:", error);
                throw new Error("Failed to clear tables: " + error.message);
            }
        }
    }
    revalidatePath("/dashboard/qr");
}
