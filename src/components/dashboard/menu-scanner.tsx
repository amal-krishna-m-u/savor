"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function MenuScanner() {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [extractedData, setExtractedData] = useState<string | null>(null);

    const handleScan = async () => {
        if (!file) return;
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            // Call API Route
            const res = await fetch("/api/scan-menu", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            setExtractedData(JSON.stringify(data, null, 2));
        } catch (e) {
            console.error(e);
            alert("Failed to scan menu");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4 border p-4 rounded-md bg-muted/50">
            <h3 className="font-semibold">AI Menu Scanner</h3>
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="menu-image">Upload Menu Image</Label>
                <Input
                    id="menu-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
            </div>
            <Button disabled={!file || isLoading} onClick={handleScan}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Analyzing..." : "Extract Items"}
            </Button>

            {extractedData && (
                <div className="mt-4">
                    <Label>Extracted Data (Preview)</Label>
                    <pre className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs overflow-auto h-64">
                        {extractedData}
                    </pre>
                    <Button className="mt-2" variant="secondary">Import items</Button>
                </div>
            )}
        </div>
    );
}
