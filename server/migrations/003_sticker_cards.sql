-- Danh mục các bộ sticker.
CREATE TABLE IF NOT EXISTS sticker_cards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  alias TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  year TEXT NOT NULL,
  status TEXT NOT NULL,
  prompt TEXT NOT NULL DEFAULT '',
  highlight BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
