import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(here, "migrations");

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** @type {Pool | undefined} */
let pool;

function getPool() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("Thiếu DATABASE_URL trong .env.local (Supabase Postgres).");
  }
  if (!pool) {
    const isLocal =
      connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    pool = new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX || 5) || 5,
      connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS || 8000) || 8000,
      idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 30000) || 30000,
      ssl: isLocal
        ? false
        : { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" },
    });
  }
  return pool;
}

function mapUser(row) {
  return {
    id: String(row.id),
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url ?? null,
    role: row.role === "admin" ? "admin" : "user",
    stickerCreations: Number(row.sticker_creations ?? 0),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function mapCard(row) {
  return {
    id: row.id,
    title: row.title,
    alias: row.alias,
    description: row.description,
    image: row.image,
    year: row.year,
    status: row.status,
    prompt: row.prompt || "",
    highlight: Boolean(row.highlight),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function mapSticker(row) {
  return {
    id: row.id,
    userId: String(row.user_id),
    cardId: row.card_id,
    title: row.title,
    image: row.image,
    outfit: row.outfit || "",
    status: row.status,
    errorMessage: row.error_message,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function ensureSchema() {
  const client = await getPool().connect();
  try {
    await runMigrations(client);

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    if (adminEmails.length) {
      await client.query(`UPDATE users SET role = 'admin' WHERE LOWER(email) = ANY($1::text[])`, [
        adminEmails,
      ]);
    }
  } finally {
    client.release();
  }
}

async function runMigrations(client) {
  await client.query("BEGIN");
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const files = (await readdir(migrationsFolder))
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const name of files) {
      const applied = await client.query(
        "SELECT 1 FROM schema_migrations WHERE name = $1",
        [name],
      );
      if (applied.rowCount) continue;

      const sql = await readFile(path.join(migrationsFolder, name), "utf8");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [name]);
      if (process.env.NODE_ENV !== "production") {
        console.log(`Applied database migration: ${name}`);
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

export async function upsertGoogleUser({ email, name, avatarUrl, isAdmin = false }) {
  const result = await getPool().query(
    `
      INSERT INTO users (email, name, avatar_url, role, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        role = CASE
          WHEN users.role = 'admin' OR EXCLUDED.role = 'admin' THEN 'admin'
          ELSE 'user'
        END,
        updated_at = NOW()
      RETURNING id, email, name, avatar_url, created_at, sticker_creations, role
    `,
    [email, name, avatarUrl || null, isAdmin ? "admin" : "user"],
  );
  return mapUser(result.rows[0]);
}

export async function createSession(userId) {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
  await getPool().query(`INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)`, [
    sessionId,
    userId,
    expiresAt,
  ]);
  return sessionId;
}

export async function getUserBySession(sessionId) {
  if (!sessionId || !UUID_PATTERN.test(sessionId)) return null;
  const result = await getPool().query(
    `
      SELECT u.id, u.email, u.name, u.avatar_url, u.created_at, u.sticker_creations, u.role
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.id = $1 AND s.expires_at > NOW()
      LIMIT 1
    `,
    [sessionId],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function deleteSession(sessionId) {
  if (!sessionId || !UUID_PATTERN.test(sessionId)) return;
  await getPool().query(`DELETE FROM sessions WHERE id = $1`, [sessionId]);
}

export async function listCards() {
  const result = await getPool().query(
    `
      SELECT id, title, alias, description, image, year, status, prompt, highlight, created_at, updated_at
      FROM sticker_cards
      ORDER BY created_at ASC
    `,
  );
  return result.rows.map(mapCard);
}

export async function getCard(id) {
  const result = await getPool().query(
    `
      SELECT id, title, alias, description, image, year, status, prompt, highlight, created_at, updated_at
      FROM sticker_cards
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );
  return result.rows[0] ? mapCard(result.rows[0]) : null;
}

export async function updateCard(id, patch) {
  const current = await getCard(id);
  if (!current) return null;
  const result = await getPool().query(
    `
      UPDATE sticker_cards
      SET title = $2, alias = $3, description = $4, image = $5, prompt = $6, updated_at = NOW()
      WHERE id = $1
      RETURNING id, title, alias, description, image, year, status, prompt, highlight, created_at, updated_at
    `,
    [
      id,
      String(patch.title || current.title).trim(),
      String(patch.alias || current.alias).trim(),
      String(patch.description || current.description).trim(),
      String(patch.image || current.image).trim(),
      String(patch.prompt || current.prompt).trim(),
    ],
  );
  return result.rows[0] ? mapCard(result.rows[0]) : null;
}

export async function createCard(patch) {
  const result = await getPool().query(
    `
      INSERT INTO sticker_cards
        (id, title, alias, description, image, year, status, prompt, highlight)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
      RETURNING id, title, alias, description, image, year, status, prompt, highlight, created_at, updated_at
    `,
    [
      String(patch.id).trim(),
      String(patch.title).trim(),
      String(patch.alias).trim(),
      String(patch.description).trim(),
      String(patch.image || "/hero-slide.png").trim(),
      String(patch.year || new Date().getFullYear()).trim(),
      String(patch.status || "16 biểu cảm").trim(),
      String(patch.prompt || "").trim(),
    ],
  );
  return result.rows[0] ? mapCard(result.rows[0]) : null;
}

export async function deleteCard(id) {
  const result = await getPool().query(
    `DELETE FROM sticker_cards WHERE id = $1 RETURNING id`,
    [id],
  );
  return Boolean(result.rows[0]);
}

export async function listUsers() {
  const result = await getPool().query(
    `
      SELECT id, email, name, avatar_url, created_at, sticker_creations, role
      FROM users
      ORDER BY created_at DESC
    `,
  );
  return result.rows.map(mapUser);
}

export async function updateUser(id, patch) {
  const role = patch.role === "admin" ? "admin" : "user";
  const result = await getPool().query(
    `
      UPDATE users
      SET name = $2,
          email = $3,
          role = $4,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, email, name, avatar_url, created_at, sticker_creations, role
    `,
    [id, String(patch.name || "").trim(), String(patch.email || "").trim(), role],
  );
  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function deleteUser(id) {
  const result = await getPool().query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [id],
  );
  return Boolean(result.rows[0]);
}

export async function listHistoryForUser(userId) {
  const result = await getPool().query(
    `
      UPDATE generated_stickers
      SET status = 'error',
          error_message = 'Job đã hết thời gian xử lý. Vui lòng thử lại.'
      WHERE user_id = $1
        AND status = 'processing'
        AND created_at < NOW() - INTERVAL '10 minutes'
    `,
    [userId],
  );
  void result;
  const rows = await getPool().query(
    `
      SELECT id, user_id, card_id, title, image, outfit, status, error_message, created_at
      FROM generated_stickers
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 100
    `,
    [userId],
  );
  return rows.rows.map(mapSticker);
}

export async function getGeneratedForUser(userId, stickerId) {
  const result = await getPool().query(
    `
      SELECT id, user_id, card_id, title, image, outfit, status, error_message, created_at
      FROM generated_stickers
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    [stickerId, userId],
  );
  return result.rows[0] ? mapSticker(result.rows[0]) : null;
}

export async function createGeneratedJob({ userId, cardId, title, outfit }) {
  const id = randomUUID();
  const result = await getPool().query(
    `
      INSERT INTO generated_stickers (id, user_id, card_id, title, image, outfit, status)
      VALUES ($1, $2, $3, $4, NULL, $5, 'processing')
      RETURNING id, user_id, card_id, title, image, outfit, status, error_message, created_at
    `,
    [id, userId, cardId, title, outfit],
  );
  return mapSticker(result.rows[0]);
}

export async function updateGeneratedJob(id, patch) {
  const result = await getPool().query(
    `
      UPDATE generated_stickers
      SET image = COALESCE($2, image),
          status = $3,
          error_message = $4
      WHERE id = $1
      RETURNING id, user_id, card_id, title, image, outfit, status, error_message, created_at
    `,
    [id, patch.image ?? null, patch.status, patch.errorMessage ?? null],
  );
  if (patch.status === "completed" && result.rows[0]) {
    await getPool().query(
      `UPDATE users SET sticker_creations = sticker_creations + 1, updated_at = NOW() WHERE id = $1`,
      [result.rows[0].user_id],
    );
  }
  return result.rows[0] ? mapSticker(result.rows[0]) : null;
}

export async function pingDatabase() {
  const result = await getPool().query("SELECT 1 AS ok");
  return result.rows[0]?.ok === 1;
}

export { SESSION_MAX_AGE_SECONDS };
