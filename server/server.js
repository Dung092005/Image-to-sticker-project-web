import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  ensureSchema,
  loginWithPassword,
  upsertGoogleUser,
  createSession,
  deleteSession,
  listCards,
  getCard,
  createCard,
  deleteCard,
  updateCard,
  listUsers,
  updateUser,
  deleteUser,
  listHistoryForUser,
  getGeneratedForUser,
  createGeneratedJob,
  pingDatabase,
} from "./db.js";
import {
  loadEnvFiles,
  writeGcpCredentialsFromEnv,
  corsHeaders,
  sessionCookie,
  oauthCookie,
  adminEmails,
  appOrigin,
  safeReturnTo,
  exchangeGoogleCode,
  fetchGoogleUserInfo,
  send,
  readBody,
  readBuffer,
  parseMultipart,
  imageType,
  cookies,
  currentUser,
} from "./helpers.js";
import {
  generatedFolder,
  generateSticker,
} from "./generator.js";

const port = Number(process.env.PORT || 3000);

await loadEnvFiles();
writeGcpCredentialsFromEnv();
await ensureSchema();
await pingDatabase();

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:3000");
  console.log(req.method, url.pathname);

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders(req));
    return res.end();
  }

  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      return send(res, 200, { ok: true, database: "supabase" }, {}, req);
    }

    if (req.method === "GET" && url.pathname === "/api/cards") {
      return send(res, 200, { cards: await listCards() }, {}, req);
    }

    if (req.method === "GET" && url.pathname === "/api/auth/me") {
      const user = await currentUser(req);
      return user
        ? send(res, 200, { user }, {}, req)
        : send(res, 401, { message: "Bạn chưa đăng nhập." }, {}, req);
    }

    if (req.method === "GET" && url.pathname === "/api/auth/google") {
      const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
      if (!clientId) {
        return res.writeHead(302, { Location: `${appOrigin()}/?authError=google_not_configured` }).end();
      }
      const state = randomBytes(32).toString("base64url");
      const returnTo = safeReturnTo(url.searchParams.get("returnTo"));
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";
      const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      googleUrl.searchParams.set("client_id", clientId);
      googleUrl.searchParams.set("redirect_uri", redirectUri);
      googleUrl.searchParams.set("response_type", "code");
      googleUrl.searchParams.set("scope", "openid email profile");
      googleUrl.searchParams.set("state", state);
      googleUrl.searchParams.set("prompt", "select_account");
      return res.writeHead(302, {
        Location: googleUrl.toString(),
        "Set-Cookie": [
          oauthCookie("stickai_oauth_state", state),
          oauthCookie("stickai_oauth_return_to", encodeURIComponent(returnTo)),
        ],
      }).end();
    }

    if (req.method === "GET" && url.pathname === "/api/auth/google/callback") {
      const cookiesFromRequest = cookies(req);
      const returnTo = safeReturnTo(
        decodeURIComponent(cookiesFromRequest.stickai_oauth_return_to || "/app"),
      );
      const fail = (code) => res.writeHead(302, {
        Location: `${appOrigin()}/?authError=${encodeURIComponent(code)}`,
        "Set-Cookie": [
          oauthCookie("stickai_oauth_state", "", 0),
          oauthCookie("stickai_oauth_return_to", "", 0),
        ],
      }).end();

      if (url.searchParams.get("error")) return fail("google_denied");
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return fail("google_not_configured");
      }
      if (!cookiesFromRequest.stickai_oauth_state ||
          cookiesFromRequest.stickai_oauth_state !== url.searchParams.get("state")) {
        return fail("state_mismatch");
      }

      try {
        const code = url.searchParams.get("code");
        if (!code) return fail("missing_code");
        const token = await exchangeGoogleCode(code);
        const accessToken = String(token.access_token || "").trim();
        if (!accessToken) return fail("token_exchange_failed");
        const googleUser = await fetchGoogleUserInfo(accessToken);
        const email = String(googleUser.email || "").trim().toLowerCase();
        const verified = googleUser.email_verified === true || googleUser.email_verified === "true";
        if (!email || !verified) return fail("missing_email");
        const user = await upsertGoogleUser({
          email,
          name: String(googleUser.name || "").trim() || email.split("@")[0],
          avatarUrl: String(googleUser.picture || "").trim() || null,
          isAdmin: adminEmails().includes(email),
        });
        const sessionId = await createSession(user.id);
        return res.writeHead(302, {
          Location: `${appOrigin()}${returnTo}`,
          "Set-Cookie": [
            sessionCookie(sessionId),
            oauthCookie("stickai_oauth_state", "", 0),
            oauthCookie("stickai_oauth_return_to", "", 0),
          ],
        }).end();
      } catch (error) {
        console.error("Google OAuth callback failed:", error);
        return fail("google_callback_failed");
      }
    }

    if (req.method === "POST" && url.pathname === "/api/auth/login") {
      const body = await readBody(req);
      if (!body) return send(res, 400, { message: "Body JSON không hợp lệ." }, {}, req);
      const user = await loginWithPassword(body.email, body.password);
      if (!user) return send(res, 401, { message: "Email hoặc mật khẩu không đúng." }, {}, req);

      const sessionId = await createSession(user.id);
      return send(
        res,
        200,
        { user },
        { "Set-Cookie": sessionCookie(sessionId) },
        req
      );
    }

    if (req.method === "POST" && url.pathname === "/api/auth/logout") {
      const sessionId = cookies(req).stickai_session;
      if (sessionId) await deleteSession(sessionId);
      return send(
        res,
        200,
        { ok: true },
        { "Set-Cookie": sessionCookie("", 0) },
        req
      );
    }

    if (req.method === "GET" && url.pathname === "/api/history") {
      const user = await currentUser(req);
      if (!user) return send(res, 401, { message: "Vui lòng đăng nhập." }, {}, req);
      return send(res, 200, { stickers: await listHistoryForUser(user.id) }, {}, req);
    }

    if (req.method === "GET" && url.pathname.startsWith("/api/generated/")) {
      const user = await currentUser(req);
      const id = url.pathname.split("/").pop();
      const sticker = user ? await getGeneratedForUser(user.id, id) : null;
      const imagePath = path.join(generatedFolder, `${id}.png`);
      if (!sticker || sticker.status !== "completed" || !existsSync(imagePath)) {
        return send(res, 404, { message: "Không tìm thấy sticker." }, {}, req);
      }
      const image = await readFile(imagePath);
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        ...corsHeaders(req),
      });
      return res.end(image);
    }

    if (req.method === "POST" && url.pathname === "/api/generate") {
      const user = await currentUser(req);
      if (!user) return send(res, 401, { message: "Vui lòng đăng nhập để tạo sticker." }, {}, req);

      const body = parseMultipart(await readBuffer(req), req.headers["content-type"] || "");
      if (!body?.file || !body.fields.cardId) {
        return send(res, 400, { message: "Cần chọn bộ sticker và tải một ảnh lên." }, {}, req);
      }

      const mimeType = imageType(body.file.data);
      if (!mimeType) {
        return send(res, 400, { message: "Chỉ nhận ảnh PNG, JPG hoặc WEBP hợp lệ." }, {}, req);
      }
      if (body.file.data.length > 10 * 1024 * 1024) {
        return send(res, 400, { message: "Ảnh không được vượt quá 10MB." }, {}, req);
      }

      const outfit = String(body.fields.outfit || "").trim();
      const additionalPrompt = [
        outfit && `Trang phục: ${outfit}`,
        String(body.fields.accessories || "").trim() && `Phụ kiện: ${String(body.fields.accessories).trim()}`,
        String(body.fields.expression || "").trim() && `Biểu cảm/vibe: ${String(body.fields.expression).trim()}`,
        String(body.fields.customPrompt || "").trim() && `Ý tưởng thêm: ${String(body.fields.customPrompt).trim()}`,
      ].filter(Boolean).join("\n");
      if (additionalPrompt.length > 800) {
        return send(res, 400, { message: "Các tùy chọn bổ sung tối đa 800 ký tự." }, {}, req);
      }

      const card = await getCard(body.fields.cardId);
      if (!card) return send(res, 404, { message: "Không tìm thấy bộ sticker." }, {}, req);

      const job = await createGeneratedJob({
        userId: user.id,
        cardId: card.id,
        title: card.title,
        outfit,
      });

      void generateSticker(job, card, outfit, additionalPrompt, body.file.data, mimeType);
      return send(res, 202, { jobId: job.id }, {}, req);
    }

    if (req.method === "GET" && url.pathname === "/api/admin") {
      const user = await currentUser(req);
      if (!user || user.role !== "admin") {
        return send(res, 403, { message: "Bạn không có quyền quản trị." }, {}, req);
      }
      return send(res, 200, {
        users: await listUsers(),
        cards: await listCards(),
      }, {}, req);
    }

    if (url.pathname.startsWith("/api/admin/users/")) {
      const admin = await currentUser(req);
      if (!admin || admin.role !== "admin") {
        return send(res, 403, { message: "Bạn không có quyền quản trị." }, {}, req);
      }
      const userId = url.pathname.split("/").pop();
      if (!/^\d+$/.test(userId)) {
        return send(res, 400, { message: "ID user không hợp lệ." }, {}, req);
      }
      if (String(admin.id) === userId) {
        return send(res, 400, { message: "Không thể chỉnh sửa hoặc xoá tài khoản đang đăng nhập." }, {}, req);
      }

      if (req.method === "PUT") {
        const body = await readBody(req);
        if (!body || !String(body.name || "").trim() || !String(body.email || "").trim()) {
          return send(res, 400, { message: "Tên và email không được để trống." }, {}, req);
        }
        const updated = await updateUser(userId, body);
        if (!updated) return send(res, 404, { message: "Không tìm thấy user." }, {}, req);
        return send(res, 200, { user: updated }, {}, req);
      }

      if (req.method === "DELETE") {
        const deleted = await deleteUser(userId);
        if (!deleted) return send(res, 404, { message: "Không tìm thấy user." }, {}, req);
        return send(res, 200, { ok: true }, {}, req);
      }
    }

    if (req.method === "PUT" && url.pathname.startsWith("/api/admin/cards/")) {
      const user = await currentUser(req);
      if (!user || user.role !== "admin") {
        return send(res, 403, { message: "Bạn không có quyền quản trị." }, {}, req);
      }
      const cardId = url.pathname.split("/").pop();
      const body = await readBody(req);
      if (!body) return send(res, 400, { message: "Body JSON không hợp lệ." }, {}, req);

      const updated = await updateCard(cardId, body);
      if (!updated) return send(res, 404, { message: "Không tìm thấy bộ sticker." }, {}, req);
      return send(res, 200, { card: updated }, {}, req);
    }

    if (req.method === "DELETE" && url.pathname.startsWith("/api/admin/cards/")) {
      const user = await currentUser(req);
      if (!user || user.role !== "admin") {
        return send(res, 403, { message: "Bạn không có quyền quản trị." }, {}, req);
      }
      const cardId = url.pathname.split("/").pop();
      const deleted = await deleteCard(cardId);
      if (!deleted) return send(res, 404, { message: "Không tìm thấy bộ sticker." }, {}, req);
      return send(res, 200, { ok: true }, {}, req);
    }

    if (req.method === "POST" && url.pathname === "/api/admin/cards") {
      const user = await currentUser(req);
      if (!user || user.role !== "admin") {
        return send(res, 403, { message: "Bạn không có quyền quản trị." }, {}, req);
      }
      const body = await readBody(req);
      if (!body || !String(body.id || "").trim() || !String(body.title || "").trim()) {
        return send(res, 400, { message: "Cần nhập ID và tên bộ sticker." }, {}, req);
      }
      const created = await createCard(body);
      return send(res, 201, { card: created }, {}, req);
    }

    return send(res, 404, { message: "Không tìm thấy API này." }, {}, req);
  } catch (error) {
    console.error(error);
    return send(res, 500, { message: "Server gặp lỗi. Xem terminal để biết chi tiết." }, {}, req);
  }
}).listen(port, "0.0.0.0", () => {
  console.log(`StickAI API: http://localhost:${port}`);
  console.log(`Database: Supabase Postgres`);
  console.log(`APP_ORIGIN: ${process.env.APP_ORIGIN || "(default localhost)"}`);
  console.log(`Python: ${process.env.STICKAI_PYTHON || "(default)"}`);
  console.log(`GCP_PROJECT_ID: ${process.env.GCP_PROJECT_ID || "(missing)"}`);
});
