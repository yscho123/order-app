-- PRD §6 — PostgreSQL 스키마

CREATE TABLE IF NOT EXISTS menus (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL CHECK (price >= 0),
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0)
);

CREATE TABLE IF NOT EXISTS menu_options (
  id SERIAL PRIMARY KEY,
  menu_id TEXT NOT NULL REFERENCES menus (id) ON DELETE CASCADE,
  option_key TEXT NOT NULL,
  name TEXT NOT NULL,
  extra_price INTEGER NOT NULL DEFAULT 0 CHECK (extra_price >= 0),
  UNIQUE (menu_id, option_key)
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (
    status IN ('received', 'preparing', 'completed')
  ),
  total INTEGER NOT NULL CHECK (total >= 0)
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  menu_id TEXT NOT NULL REFERENCES menus (id),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  line_total INTEGER NOT NULL CHECK (line_total >= 0),
  option_ids JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders (placed_at DESC);
