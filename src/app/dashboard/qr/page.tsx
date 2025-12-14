"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { Printer, Trash, Plus, RefreshCw, Loader2 } from "lucide-react";
import { Toaster, toast } from "sonner";
import { getTables, bulkCreateTables, deleteTable, clearTables, getFoodCourts, createTable, TableWithQR } from "./actions";

export default function QRDashboard() {
    const [foodCourts, setFoodCourts] = useState<{ id: string; name: string }[]>([]);
    const [selectedFoodCourtId, setSelectedFoodCourtId] = useState<string>("");
    const [tables, setTables] = useState<TableWithQR[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Table State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTableLabel, setNewTableLabel] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    // Bulk Create State
    const [isBulkOpen, setIsBulkOpen] = useState(false);
    const [bulkStartLabel, setBulkStartLabel] = useState("1");
    const [bulkCount, setBulkCount] = useState("5");
    const [bulkError, setBulkError] = useState<string | null>(null);
    const [bulkGenerating, setBulkGenerating] = useState(false);

    // Clear Confirm State
    const [isClearOpen, setIsClearOpen] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    // Delete Confirm State
    const [deleteConfig, setDeleteConfig] = useState<{ id: string; label: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchFoodCourts = async () => {
            setLoadingError(null);
            try {
                // Short 3s timeout for initial load
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Request timed out")), 3000)
                );

                const courts = await Promise.race([
                    getFoodCourts(),
                    timeoutPromise
                ]) as { id: string; name: string, slug: string }[];

                setFoodCourts(courts);
                if (courts.length > 0) {
                    const demo = courts.find(c => c.slug === 'demo');
                    setSelectedFoodCourtId(demo ? demo.id : courts[0].id);
                } else {
                    setLoading(false);
                }
            } catch (err: any) {
                console.error("Failed to load food courts", err);
                setLoadingError(err.message === "Request timed out" ? "Taking too long to load." : "Failed to load food courts.");
                setLoading(false);
            }
        };

        fetchFoodCourts();
    }, []);

    useEffect(() => {
        if (!selectedFoodCourtId) return;
        loadTables(selectedFoodCourtId);
    }, [selectedFoodCourtId]);

    const loadTables = async (fcId: string) => {
        setLoading(true);
        setLoadingError(null);
        try {
            // 3 second timeout for table load
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out")), 3000)
            );

            const data = await Promise.race([
                getTables(fcId),
                timeoutPromise
            ]) as TableWithQR[];

            setTables(data || []);
        } catch (error: any) {
            console.error("Failed to load tables", error);
            setLoadingError("Slow connection. Please retry.");
            setTables([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkGenerate = async () => {
        if (!selectedFoodCourtId) return;
        setLoadingError(null);
        const count = parseInt(bulkCount);
        if (isNaN(count) || count < 1) {
            setLoadingError("Please enter a valid count.");
            return;
        }

        setBulkGenerating(true);
        try {
            await bulkCreateTables(selectedFoodCourtId, bulkStartLabel, count);
            setIsBulkOpen(false);
            await loadTables(selectedFoodCourtId);
        } catch (e: any) {
            setLoadingError(e.message);
        } finally {
            setBulkGenerating(false);
        }
    };

    const handleClear = async () => {
        if (!selectedFoodCourtId) return;
        setClearing(true);
        try {
            await clearTables(selectedFoodCourtId);
            await loadTables(selectedFoodCourtId);
            setIsClearOpen(false);
        } catch (e: any) {
            alert(e.message || "Failed to clear tables");
        } finally {
            setClearing(false);
        }
    };

    const handleDeleteClick = (id: string, label: string) => {
        setDeleteConfig({ id, label });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfig) return;
        setDeleting(true);
        try {
            await deleteTable(deleteConfig.id);
            toast.success(`Table ${deleteConfig.label} deleted.`);
            await loadTables(selectedFoodCourtId);
            setDeleteConfig(null);
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setDeleting(false);
        }
    };

    const handleCreateTable = async () => {
        if (!newTableLabel || !selectedFoodCourtId) return;
        setCreating(true);
        try {
            await createTable(selectedFoodCourtId, newTableLabel);
            setNewTableLabel("");
            setIsCreateOpen(false);
            await loadTables(selectedFoodCourtId);
        } catch (e: any) {
            alert(e.message || "Failed to create table");
        } finally {
            setCreating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">QR Codes</h2>
                    <p className="text-muted-foreground mt-1">
                        Select a food court and manage your table QR codes.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    {/* Food Court Selector */}
                    <div className="w-[200px]">
                        <Select value={selectedFoodCourtId} onValueChange={setSelectedFoodCourtId} disabled={loading && !foodCourts.length}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Food Court" />
                            </SelectTrigger>
                            <SelectContent>
                                {foodCourts.map(fc => (
                                    <SelectItem key={fc.id} value={fc.id}>{fc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator orientation="vertical" className="h-8 hidden md:block" />

                    {/* Delete Confirmation Dialog */}
                    <Dialog open={!!deleteConfig} onOpenChange={(open) => !open && setDeleteConfig(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Table {deleteConfig?.label}?</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete this table? The existing QR code will stop working.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteConfig(null)} disabled={deleting}>
                                    Cancel
                                </Button>
                                <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleting}>
                                    {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Clear Dialog */}
                    <Dialog open={isClearOpen} onOpenChange={setIsClearOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" disabled={loading || tables.length === 0 || !selectedFoodCourtId}>
                                <Trash className="w-4 h-4 mr-2" />
                                Clear All
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Clear All Tables?</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete all tables for this food court?
                                    This will break any printed QR codes. This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsClearOpen(false)}>Cancel</Button>
                                <Button variant="destructive" onClick={handleClear} disabled={clearing}>
                                    {clearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Yes, Clear All
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Create Specific Table Dialog */}
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" disabled={loading || !selectedFoodCourtId}>
                                <Plus className="w-4 h-4 mr-2" /> One
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Table</DialogTitle>
                                <DialogDescription>
                                    Enter a label for the table (e.g., "12", "Patio-1").
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Input
                                    placeholder="Table Label"
                                    value={newTableLabel}
                                    onChange={(e) => setNewTableLabel(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateTable} disabled={!newTableLabel || creating}>
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Bulk Generate Dialog */}
                    <Dialog open={isBulkOpen} onOpenChange={(open) => {
                        setIsBulkOpen(open);
                        if (!open) setLoadingError(null); // Clear error on close
                    }}>
                        <DialogTrigger asChild>
                            <Button variant="secondary" size="sm" disabled={loading || !selectedFoodCourtId}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Bulk
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Bulk Generate Tables</DialogTitle>
                                <DialogDescription>
                                    Quickly create a sequence of tables (e.g., 101, 102, 103...).
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label htmlFor="start" className="text-right text-sm">Start #</label>
                                    <Input id="start" value={bulkStartLabel} onChange={(e) => setBulkStartLabel(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <label htmlFor="count" className="text-right text-sm">Count</label>
                                    <Input id="count" type="number" min="1" max="50" value={bulkCount} onChange={(e) => setBulkCount(e.target.value)} className="col-span-3" />
                                </div>
                                {/* Persistent Error Message */}
                                {loadingError && <p className="text-red-500 text-sm font-medium text-center">{loadingError}</p>}
                            </div>
                            <DialogFooter>
                                <Button onClick={handleBulkGenerate} disabled={bulkGenerating}>
                                    {bulkGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Generate
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Button onClick={handlePrint} variant="ghost" size="icon" title="Print All">
                        <Printer className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <Separator className="no-print" />

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
                </div>
            ) : loadingError ? (
                <div className="text-center py-12 border-2 border-dashed border-red-200 bg-red-50 rounded-lg text-red-600">
                    <h3 className="text-lg font-medium">Something went wrong</h3>
                    <p className="text-sm mb-4">{loadingError}</p>
                    <Button onClick={() => loadTables(selectedFoodCourtId)} variant="destructive" size="sm">
                        Retry Loading
                    </Button>
                </div>
            ) : tables.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-medium">No tables found</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        {!selectedFoodCourtId ? "Please select a food court." : "Create a table to get started."}
                    </p>
                    {selectedFoodCourtId && (
                        <div className="flex gap-2 justify-center">
                            <Button onClick={() => setIsCreateOpen(true)}>Create One</Button>
                            <Button variant="outline" onClick={() => setIsBulkOpen(true)}>Bulk Generate</Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:block">
                    <div className="hidden print:grid print:grid-cols-2 print:gap-0 print:w-full print:h-full">
                        {/* Print Layout: 2 items per row, fitting A4 */}
                        {/* We use a separate rendering logic for Print to ensure strict styling */}
                    </div>

                    {/* Normal Screen Layout */}
                    {tables.map((table) => (
                        <Card key={table.id} className="relative group hover:shadow-md transition-shadow print:break-inside-avoid print:border-2 print:m-2 print:shadow-none print:h-[45vh] print:flex print:flex-col print:justify-between">
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteClick(table.id, table.label)}>
                                    <Trash className="w-4 h-4" />
                                </Button>
                            </div>

                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-xl">Table {table.label}</CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-center py-4 bg-white grow">
                                <QRCodeSVG
                                    value={table.qrCodeUrl}
                                    size={200}
                                    level="H"
                                    includeMargin
                                    className="w-full h-auto max-w-[200px]"
                                />
                            </CardContent>
                            <CardFooter className="flex justify-center pb-4 text-sm text-gray-500 bg-gray-50/50 print:bg-white print:border-t">
                                Scan to Order
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}

            <style jsx global>{`
                @media print {
                    @page { margin: 1cm; size: A4; }
                    .no-print { display: none !important; }
                    body { background: white; -webkit-print-color-adjust: exact; }
                    /* Force 2 columns Grid for A4 */
                    .print\\:block { 
                        display: grid !important; 
                        grid-template-columns: 1fr 1fr !important;
                        gap: 1cm !important;
                    }
                }
            `}</style>
        </div>
    );
}
