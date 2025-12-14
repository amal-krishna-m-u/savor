"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSharedCart } from "@/hooks/use-shared-cart";
import { ShoppingCart } from "lucide-react";
import { AIChatButton } from "@/components/customer/ai-chat-button";
import { CartSheet } from "@/components/customer/cart-sheet";
import { useMemo } from "react";

// Mock Data Fallback (if no items in DB)
const MOCK_MENU_FALLBACK = [
    { id: "1", name: "Spicy Tofu", price: 12.99, category: "Mains", restaurantId: "r1", restaurantName: "Thai Spice", description: "Crispy tofu with chili sauce" },
];

export interface MenuItem {
    id: string;
    name: string;
    price: number;
    description: string;
    restaurantId: string;
    restaurantName: string;
    category?: string;
    image_url?: string | null;
}

interface CustomerMenuViewProps {
    tableId: string;
    tableLabel?: string;
    initialMenuItems: MenuItem[];
}

export function CustomerMenuView({ tableId, tableLabel, initialMenuItems }: CustomerMenuViewProps) {
    const { sessionId, cartItems, addToCart, removeFromCart, updateQuantity, loading } = useSharedCart(tableId);

    const menuItems = initialMenuItems.length > 0 ? initialMenuItems : MOCK_MENU_FALLBACK;

    // Hydrate cart items with menu details
    const hydratedCart = useMemo(() => {
        return cartItems.map(ci => {
            const menuItem = menuItems.find(m => m.id === ci.menu_item_id);
            if (!menuItem) return null;
            return {
                id: ci.id, // Database ID for removal
                menuId: ci.menu_item_id,
                quantity: ci.quantity,
                // Menu Details
                name: menuItem.name,
                price: menuItem.price,
                restaurantId: menuItem.restaurantId,
                restaurantName: menuItem.restaurantName
            };
        }).filter(Boolean) as {
            id: string;
            name: string;
            price: number;
            quantity: number;
            restaurantId: string;
            restaurantName: string;
            menuId: string;
        }[];
    }, [cartItems]);

    const cartCount = hydratedCart.reduce((acc, i) => acc + i.quantity, 0);

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold">Menu</h2>
                    {tableLabel && <p className="text-sm text-muted-foreground">You are seated at <span className="font-semibold text-primary">Table {tableLabel}</span></p>}
                </div>

                {/* Cart Sheet Trigger */}
                <CartSheet
                    tableId={tableId}
                    sessionId={sessionId}
                    items={hydratedCart}
                    onRemove={removeFromCart}
                >
                    <div className="cursor-pointer">
                        <Badge variant={loading ? "outline" : "secondary"} className="text-sm px-3 py-1 hover:bg-gray-200 transition">
                            <ShoppingCart className="w-4 h-4 mr-1" />
                            {loading ? "..." : `${cartCount} items`}
                        </Badge>
                    </div>
                </CartSheet>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {menuItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4 shadow-sm bg-white flex flex-col justify-between h-full">
                        <div>
                            <div className="h-32 bg-gray-200 rounded-md mb-3"></div> {/* Placeholder Image */}
                            <div className="flex justify-between items-start">
                                <h3 className="font-semibold text-lg">{item.name}</h3>
                                <span className="font-bold">${item.price.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-blue-600 font-medium mt-0.5">{item.restaurantName}</div>
                            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        </div>
                        <Button
                            className="mt-4 w-full"
                            onClick={() => addToCart(item.id, 1)}
                            disabled={loading}
                        >
                            Add to Cart
                        </Button>
                    </div>
                ))}
            </div>

            {/* Floating AI Waiter Button */}
            <AIChatButton menuContext={menuItems} />
        </div>
    );
}
