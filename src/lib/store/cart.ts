import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
    id: string; // SKU or Menu Item ID
    name: string;
    price: number;
    quantity: number;
    restaurantId: string;
    restaurantName: string; // Added for display
}

interface CartState {
    items: CartItem[];
    addToCart: (item: Omit<CartItem, "quantity">) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    clearCart: () => void;
    total: () => number;
}

export const useCart = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            addToCart: (newItem) =>
                set((state) => {
                    const existing = state.items.find((i) => i.id === newItem.id);
                    if (existing) {
                        return {
                            items: state.items.map((i) =>
                                i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
                            ),
                        };
                    }
                    return { items: [...state.items, { ...newItem, quantity: 1 }] };
                }),
            removeFromCart: (itemId) =>
                set((state) => ({
                    items: state.items.filter((i) => i.id !== itemId),
                })),
            updateQuantity: (itemId, qty) =>
                set((state) => ({
                    items: qty === 0
                        ? state.items.filter((i) => i.id !== itemId)
                        : state.items.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i)),
                })),
            clearCart: () => set({ items: [] }),
            total: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
        }),
        {
            name: "savor-cart-storage",
        }
    )
);
