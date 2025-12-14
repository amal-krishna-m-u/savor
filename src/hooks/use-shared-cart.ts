"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { nanoid } from "nanoid";

// Define simpler types for now since we might not have full generated types
export type CartItem = {
    id: string;
    session_id: string;
    menu_item_id: string;
    quantity: number;
    notes?: string;
    added_by?: string;
    // We might need to fetch the actual menu item details (name, price) separately 
    // or join them. For the UI, we usually have the menu loaded.
};

export type CartSession = {
    id: string;
    table_id: string;
    status: string;
};

export function useSharedCart(tableId: string) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    // 1. Initialize Session
    useEffect(() => {
        if (!tableId) return;

        const initSession = async () => {
            setLoading(true);

            // Find active session
            const { data: sessions, error } = await supabase
                .from("cart_sessions")
                .select("*")
                .eq("table_id", tableId)
                .eq("status", "active")
                .limit(1);

            if (sessions && sessions.length > 0) {
                console.log("Found existing session:", sessions[0].id);
                setSessionId(sessions[0].id);
            } else {
                // Create new session
                console.log("Creating new session for table:", tableId);
                const { data: newSession, error: createError } = await supabase
                    .from("cart_sessions")
                    .insert({ table_id: tableId, status: "active" })
                    .select()
                    .single();

                if (newSession) {
                    setSessionId(newSession.id);
                } else if (createError) {
                    console.error("Failed to create session", createError);
                }
            }
            setLoading(false);
        };

        initSession();
    }, [tableId]);

    // 2. Subscribe to Items
    useEffect(() => {
        if (!sessionId) return;

        // Fetch initial items
        const fetchItems = async () => {
            const { data } = await supabase
                .from("cart_items")
                .select("*")
                .eq("session_id", sessionId);
            if (data) setCartItems(data);
        };
        fetchItems();

        // Subscribe to changes
        const channel = supabase
            .channel(`cart:${sessionId}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "cart_items", filter: `session_id=eq.${sessionId}` },
                (payload) => {
                    console.log("Realtime update:", payload);
                    fetchItems(); // Simple strategy: re-fetch all on any change
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId]);

    // 3. Actions
    const addToCart = useCallback(async (menuItemId: string, quantity: number, notes?: string) => {
        if (!sessionId) return;

        // Check if item exists to update quantity
        const existing = cartItems.find(i => i.menu_item_id === menuItemId && i.notes === notes);

        if (existing) {
            await supabase
                .from("cart_items")
                .update({ quantity: existing.quantity + quantity })
                .eq("id", existing.id);
        } else {
            await supabase
                .from("cart_items")
                .insert({
                    session_id: sessionId,
                    menu_item_id: menuItemId,
                    quantity,
                    notes,
                    added_by: "user" // Placeholder
                });
        }
    }, [sessionId, cartItems]);

    const removeFromCart = useCallback(async (itemId: string) => {
        if (!sessionId) return;
        await supabase.from("cart_items").delete().eq("id", itemId);
    }, [sessionId]);

    const updateQuantity = useCallback(async (itemId: string, delta: number) => {
        if (!sessionId) return;
        const existing = cartItems.find(i => i.id === itemId);
        if (!existing) return;

        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
            await removeFromCart(itemId);
        } else {
            await supabase
                .from("cart_items")
                .update({ quantity: newQty })
                .eq("id", itemId);
        }
    }, [sessionId, cartItems, removeFromCart]);

    return {
        sessionId,
        cartItems,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity
    };
}
