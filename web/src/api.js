// In production on Vercel, leave VITE_API_URL empty and use vercel.json rewrite → Render.
// Set VITE_API_URL only if the browser calls the API host directly (no proxy).
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function apiUrl(path) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE}${path}`;
}

export async function api(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    credentials: "include",
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }
  return data;
}

export async function apiRaw(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    credentials: "include",
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

export { apiUrl };

/** Files that exist in web/public (and therefore on Vercel). */
const PUBLIC_IMAGES = new Set([
  "/hero.png",
  "/hero-slide.png",
  "/step-choose-pack.png",
  "/step-receive-stickers.png",
  "/step-upload-photo.png",
]);

/** Old Sticker-WEBAPP paths → local public assets. */
const LEGACY_CARD_IMAGES = {
  "/sticker-hero-illustrated.png": "/hero-slide.png",
  "/stickai-demo-visual.png": "/hero-slide.png",
  "/app-beach-banner-desktop.png": "/hero.png",
};

const FALLBACK_IMAGE = "/hero-slide.png";

export function resolveCardImage(image) {
  const mapped = LEGACY_CARD_IMAGES[image] || image || FALLBACK_IMAGE;
  return PUBLIC_IMAGES.has(mapped) ? mapped : FALLBACK_IMAGE;
}
