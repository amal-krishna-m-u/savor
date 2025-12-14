-- Enable pgvector extension for AI features
create extension if not exists vector;

-- 1. Food Courts
create table public.food_courts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  location_config jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Restaurants
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  food_court_id uuid references public.food_courts(id) not null,
  name text not null,
  description text,
  logo_url text,
  owner_user_id uuid references auth.users(id), -- Linked to Supabase Auth
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) not null,
  name text not null,
  rank integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Menu Items
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) not null,
  category_id uuid references public.categories(id),
  name text not null,
  description text,
  price decimal(10, 2) not null,
  image_url text,
  is_available boolean default true,
  dietary_info jsonb default '[]'::jsonb, -- e.g. ["vegan", "gluten_free"]
  embedding vector(768), -- For Gemini/Vertex AI Embeddings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Tables
create table public.tables (
  id uuid primary key default gen_random_uuid(),
  food_court_id uuid references public.food_courts(id) not null,
  label text not null, -- "Table 1", "Table A2"
  qr_code_svg text, -- Optional: cache the SVG
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Orders
-- Note: Simplified status flow. Payment handled manually.
create type public.order_status as enum ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled');
create type public.payment_status as enum ('unpaid', 'paid');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants(id) not null,
  table_id uuid references public.tables(id) not null,
  user_session_id uuid, -- Anonymous session ID from client
  status public.order_status default 'pending',
  payment_status public.payment_status default 'unpaid',
  total_amount decimal(10, 2) not null,
  items jsonb not null, -- Snapshot of items: [{name, price, qty, options}]
  customer_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies (Basic Setup)

-- Food Courts: Public Read
alter table public.food_courts enable row level security;
create policy "Food Courts are viewable by everyone" on public.food_courts for select using (true);

-- Restaurants: Public Read
alter table public.restaurants enable row level security;
create policy "Restaurants are viewable by everyone" on public.restaurants for select using (true);

-- Menu Items: Public Read
alter table public.menu_items enable row level security;
create policy "Menu Items are viewable by everyone" on public.menu_items for select using (true);

-- Tables: Public Read
alter table public.tables enable row level security;
create policy "Tables are viewable by everyone" on public.tables for select using (true);
create policy "Admins can insert tables" on public.tables for insert with check (true); -- Relaxed for MVP Demo
create policy "Admins can delete tables" on public.tables for delete using (true); -- Relaxed for MVP Demo

-- Orders: 
-- Public Insert (Customers placing orders)
alter table public.orders enable row level security;
create policy "Customers can create orders" on public.orders for insert with check (true);

-- Restaurants can view their own orders
create policy "Restaurants can view their own orders" on public.orders for select using (
  auth.uid() in (
    select owner_user_id from public.restaurants where id = restaurant_id
  )
);

-- Indexes for performance
create index idx_restaurants_food_court on public.restaurants(food_court_id);
create index idx_menu_items_restaurant on public.menu_items(restaurant_id);
create index idx_orders_restaurant on public.orders(restaurant_id);
create index idx_orders_status on public.orders(status);
