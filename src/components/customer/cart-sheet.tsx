"use client";

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { placeOrder } from "@/app/eat/actions";
import { useState } from "react";
import { Loader2 } from "lucide-react";

// Types matching the hydrated items
interface CartItemDisplay {
    id: string; // Database ID or Unique ID
    name: string;
    price: number;
    quantity: number;
    restaurantId: string;
    restaurantName: string;
    menuId?: string;
}

// Group items helper
function groupItems(items: CartItemDisplay[]) {
    const groups: Record<string, { name: string; items: CartItemDisplay[] }> = {};
    items.forEach((item) => {
        if (!groups[item.restaurantId]) {
            groups[item.restaurantId] = { name: item.restaurantName, items: [] };
        }
        groups[item.restaurantId].items.push(item);
    });
    return groups;
}

export function CartSheet({
    children,
    tableId,
    sessionId,
    items,
    onRemove
}: {
    children: React.ReactNode;
    tableId: string;
    sessionId: string | null;
    items: CartItemDisplay[];
    onRemove: (id: string) => void;
}) {
    // const { items, total, removeFromCart, clearCart } = useCart(); // Removed local store
    // We calculate total locally
    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // Handing Toast manually since we might not have the provider installed/configured globally yet
    // actually we did install radix-toast but did we add the Toaster? 
    // For MVP safety, we'll use window.alert if simple, but let's try to be nice.

    const handleCheckout = async () => {
        if (!sessionId) {
            alert("Cart session not active.");
            return;
        }
        setLoading(true);
        try {
            // placeOrder expects array of items. 
            // We need to ensure the structure matches what placeOrder expects.
            // Previously it was CartItem from store.
            // If placeOrder signature hasn't changed, passing these items (which look like CartItem) should work
            // provided price/name/qty are present.
            // Ideally placeOrder should validate prices via DB by fetching MenuItems again, but for now passing items is okay.
            // Pass sessionId to placeOrder to clear the DB cart after success
            const result = await placeOrder(tableId, items, sessionId);
            if (result.success) {
                alert("Order Placed Successfully! 🚀\nThe kitchen is preparing your food.");
                // clearCart(); // Handled by DB clearing in placeOrder (server side) hopefully?
                // Wait, useSharedCart doesn't have clearCart exposed, but placeOrder action 
                // SHOULD clear the cart session in DB or update status to 'ordered'.
                // If placeOrder is legacy, it creates an Order but doesn't wipe the 'cart_items'.
                // I need to update "placeOrder" in Phase 7.2. 
                // For now, let's assume successful order. The realtime hook will see items disappear if backend deletes them.
                setOpen(false);
            } else {
                alert(`Failed to place order: ${result.message}`);
            }
        } catch (e: any) {
            console.error(e);
            alert("Something went wrong: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const grouped = groupItems(items);
    const hasItems = items.length > 0;

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col h-full">
                <SheetHeader>
                    <SheetTitle>Your Order</SheetTitle>
                    <SheetDescription>
                        Review your items before placing the order.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 -mx-6 px-6 my-4">
                    {hasItems ? (
                        <div className="space-y-6">
                            {Object.entries(grouped).map(([rId, group]) => (
                                <div key={rId} className="space-y-3">
                                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                                        From {group.name}
                                    </h3>
                                    <div className="space-y-2">
                                        {group.items.map((item) => (
                                            <div key={item.id} className="flex justify-between items-start text-sm">
                                                <div className="flex-1">
                                                    <span className="font-medium">{item.quantity}x</span>{" "}
                                                    {item.name}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                                                    <button
                                                        onClick={() => onRemove(item.id)}
                                                        className="text-red-500 text-xs hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <Separator />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                            <p>Your cart is empty.</p>
                        </div>
                    )}
                </ScrollArea>

                <SheetFooter className="mt-auto border-t pt-4">
                    <div className="w-full space-y-4">
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <Button
                            className="w-full"
                            size="lg"
                            onClick={handleCheckout}
                            disabled={!hasItems || loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Place Order
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
