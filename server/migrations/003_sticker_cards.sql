-- Danh mục các chủ đề / bộ sticker mà người dùng có thể chọn.
CREATE TABLE IF NOT EXISTS sticker_cards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  alias TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  topic TEXT NOT NULL,
  year TEXT NOT NULL,
  status TEXT NOT NULL,
  prompt TEXT NOT NULL DEFAULT '',
  highlight BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
