-- Shared Cart Schema

-- 1. Cart Sessions: Represents a "Table's Actives Session"
-- One table usually has one active session at a time (or we can just query by table_id and status)
CREATE TABLE cart_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' -- 'active', 'ordered', 'abandoned'
);

-- Index for fast lookups by table
CREATE INDEX idx_cart_sessions_table_id ON cart_sessions(table_id);

-- 2. Cart Items: The actual items in the cart
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES cart_sessions(id) ON DELETE CASCADE,
    menu_item_id TEXT NOT NULL, -- Assuming ID from oRPC/Prisma is text/uuid. Storing as text to be safe or FK if we have a table.
    quantity INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    added_by TEXT, -- Optional: User identifier/name if we have it later
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cart_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Policies (Public for now for Demo/MVP speed, can refine later)
CREATE POLICY "Public read/write sessions" ON cart_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write items" ON cart_items FOR ALL USING (true) WITH CHECK (true);

-- Realtime: Enable replication on these tables so clients can listen
ALTER PUBLICATION supabase_realtime ADD TABLE cart_sessions, cart_items;
