import crypto from "crypto";

const SECRET_KEY = process.env.SIGNED_URL_SECRET || "default-secret-change-me";

export function signUrlParams(params: Record<string, string>): string {
    // Sort keys to ensure deterministic signature
    const sortedKeys = Object.keys(params).sort();
    const dataString = sortedKeys.map((key) => `${key}=${params[key]}`).join("&");

    const hmac = crypto.createHmac("sha256", SECRET_KEY);
    hmac.update(dataString);
    return hmac.digest("hex");
}

export function verifyUrlSignature(
    params: Record<string, string>,
    signature: string
): boolean {
    const expectedSignature = signUrlParams(params);
    // Constant time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
}

export function generateSignedScanUrl(baseUrl: string, tableId: string): string {
    const params = { table: tableId, timestamp: Date.now().toString() };
    const signature = signUrlParams(params);

    const searchParams = new URLSearchParams(params);
    searchParams.append("sig", signature);

    return `${baseUrl}?${searchParams.toString()}`;
}
