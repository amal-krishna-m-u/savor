import { NextRequest, NextResponse } from "next/server";
import { verifyUrlSignature } from "@/lib/crypto";

export async function validateScanRequest(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const signature = searchParams.get("sig");
    const table = searchParams.get("table");
    const timestamp = searchParams.get("timestamp");

    if (!signature || !table || !timestamp) {
        return NextResponse.json(
            { error: "Missing signature or parameters" },
            { status: 400 }
        );
    }

    // Verify signature
    const params = { table, timestamp };
    const isValid = verifyUrlSignature(params, signature);

    if (!isValid) {
        return NextResponse.json(
            { error: "Invalid signature" },
            { status: 403 }
        );
    }

    // Optional: Check timestamp freshness (e.g., expire after 24h?)
    // For static QR codes on tables, maybe we don't expire them, 
    // but we sign them once. 
    // If dynamic, checks age here.

    return null; // Valid
}
