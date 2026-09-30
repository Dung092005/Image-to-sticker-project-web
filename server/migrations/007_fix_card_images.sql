-- StickAI only ships a few public assets under web/public.
-- Remap legacy Sticker-WEBAPP image paths so card covers do not 404.
UPDATE sticker_cards
SET image = '/hero-slide.png',
    updated_at = NOW()
WHERE image IN (
  '/sticker-hero-illustrated.png',
  '/stickai-demo-visual.png'
);

UPDATE sticker_cards
SET image = '/hero.png',
    updated_at = NOW()
WHERE image = '/app-beach-banner-desktop.png';
