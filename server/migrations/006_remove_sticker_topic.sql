-- Remove the unused topic field from the shared sticker card table.
-- No CASCADE: fail safely if another database object still depends on this column.
ALTER TABLE public.sticker_cards DROP COLUMN IF EXISTS topic;
