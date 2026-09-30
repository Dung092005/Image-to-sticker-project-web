-- Yêu cầu tạo sticker và trạng thái xử lý/kết quả theo từng người dùng.
CREATE TABLE IF NOT EXISTS generated_stickers (
  id UUID PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  title TEXT NOT NULL,
  image TEXT,
  outfit TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'processing',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
