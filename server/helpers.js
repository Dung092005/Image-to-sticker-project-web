import { readFile } from "node:fs/promises";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getUserBySession, SESSION_MAX_AGE_SECONDS } from "./db.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectFolder = path.join(here, "..");

export async function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const filePath = path.join(projectFolder, name);
    if (!existsSync(filePath)) continue;
    const text = await readFile(filePath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index < 0) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  }
}

export function writeGcpCredentialsFromEnv() {
  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  if (!json) return;
  const credPath = path.join(here, "gcp-service-account.json");
  writeFileSync(credPath, json, "utf8");
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
}

export function allowedOrigins() {
  return (process.env.APP_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

export function corsHeaders(req) {
  const origin = req.headers.origin || "";
  const allowed = allowedOrigins();
  const headers = {
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else if (allowed.length === 1 && !req.headers.origin) {
    // Same-origin proxy (Vercel rewrite) often has no browser Origin on some requests.
  }
  return headers;
}

export function sessionCookie(value, maxAge = SESSION_MAX_AGE_SECONDS) {
  const secure =
    process.env.COOKIE_SECURE === "true" ||
    process.env.NODE_ENV === "production";
  // Default Lax = Vercel rewrite cùng site FE. Đặt COOKIE_SAMESITE=None nếu FE gọi thẳng Render.
  const sameSite = process.env.COOKIE_SAMESITE || "Lax";
  const parts = [
    `stickai_session=${value}`,
    "HttpOnly",
    `SameSite=${sameSite}`,
    "Path=/",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function oauthCookie(name, value, maxAge = 600) {
  const secure = process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
  return [
    `${name}=${value}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
    `Max-Age=${maxAge}`,
    secure ? "Secure" : "",
  ].filter(Boolean).join("; ");
}

export function adminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function appOrigin() {
  return (process.env.APP_ORIGIN || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");
}

export function safeReturnTo(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/app";
}

export async function exchangeGoogleCode(code) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback",
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(10000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error_description || payload.error || "Google token exchange failed.");
  return payload;
}

export async function fetchGoogleUserInfo(accessToken) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error("Không lấy được thông tin tài khoản Google.");
  return response.json();
}

export function send(res, status, body, extraHeaders = {}, req = null) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ...(req ? corsHeaders(req) : {}),
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

export async function readBody(req) {
  let text = "";
  for await (const chunk of req) text += chunk;
  try {
    return JSON.parse(text || "{}");
  } catch {
    return null;
  }
}

export async function readBuffer(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export function parseMultipart(buffer, contentType) {
  const boundary = contentType.match(/boundary=(.+)$/)?.[1];
  if (!boundary) return null;
  const parts = buffer.toString("binary").split(`--${boundary}`);
  const fields = {};
  let file = null;

  for (const part of parts) {
    const divider = part.indexOf("\r\n\r\n");
    if (divider < 0) continue;
    const headers = part.slice(0, divider);
    let body = part.slice(divider + 4);
    if (body.endsWith("\r\n")) body = body.slice(0, -2);
    const name = headers.match(/name="([^"]+)"/)?.[1];
    if (!name) continue;
    const filename = headers.match(/filename="([^"]*)"/)?.[1];
    if (filename !== undefined) {
      file = {
        name: filename,
        type: headers.match(/Content-Type:\s*([^\r\n]+)/i)?.[1]?.trim() || "",
        data: Buffer.from(body, "binary"),
      };
    } else {
      fields[name] = Buffer.from(body, "binary").toString("utf8");
    }
  }
  return { fields, file };
}

export function imageType(data) {
  if (data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "image/png";
  if (data.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return "image/jpeg";
  if (
    data.subarray(0, 4).toString("ascii") === "RIFF" &&
    data.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function cookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((part) => part.trim().split("="))
      .filter(([key]) => key)
  );
}

export async function currentUser(req) {
  return getUserBySession(cookies(req).stickai_session);
}

