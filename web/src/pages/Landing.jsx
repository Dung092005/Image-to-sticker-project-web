import { useState } from "react";
import { apiRaw, apiUrl } from "../api.js";

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const [mode, setMode] = useState("login");
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function openLogin(nextMode = "login") {
    setMode(nextMode);
    setMessage("");
    setShowLogin(true);
  }

  async function submitPassword(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const path = mode === "register" ? "/api/auth/register" : "/api/auth/login";
    const body = mode === "register"
      ? { username: identifier, name, password }
      : { identifier, password };
    try {
      const { response, data } = await apiRaw(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(data.message || "Không thể đăng nhập.");
      window.location.assign("/app");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function continueAsGuest() {
    setSubmitting(true);
    setMessage("");
    try {
      const { response, data } = await apiRaw("/api/auth/guest", { method: "POST" });
      if (!response.ok) throw new Error(data.message || "Không thể vào chế độ khách.");
      window.location.assign("/app");
    } catch (error) {
      setMessage(error.message);
      setSubmitting(false);
    }
  }

  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Stickers riêng của bạn</p>
          <h1>Một tấm ảnh, cả bộ sticker.</h1>
          <p className="hero-lead">
            Chọn một chủ đề, tải ảnh lên và biến cá tính của bạn thành bộ sticker
            để dùng trong mọi cuộc trò chuyện.
          </p>
          <div className="cta-row">
            <button className="primary hero-cta" type="button" onClick={() => setShowLogin(true)}>
              Truy cập ngay
            </button>
          </div>
        </div>

      </section>

      {showLogin && (
        <div className="backdrop">
          <div className="login-card">
            <button className="close" type="button" onClick={() => setShowLogin(false)}>
              ×
            </button>
            <h2>{mode === "register" ? "Tạo tài khoản StickAI" : "Bắt đầu với StickAI"}</h2>
            <p className="modal-intro">
              {mode === "register"
                ? "Tạo tài khoản bằng tên tài khoản bất kỳ, không cần email."
                : "Chọn cách đăng nhập phù hợp với bạn."}
            </p>
            <div className="auth-tabs" role="tablist" aria-label="Phương thức đăng nhập">
              <button
                type="button"
                className={mode === "login" ? "active" : ""}
                onClick={() => { setMode("login"); setMessage(""); }}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className={mode === "register" ? "active" : ""}
                onClick={() => { setMode("register"); setMessage(""); }}
              >
                Đăng ký
              </button>
            </div>
            <form onSubmit={submitPassword}>
              {mode === "register" && (
                <label>
                  Tên hiển thị
                  <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
                </label>
              )}
              <label>
                {mode === "register" ? "Tên tài khoản" : "Tài khoản hoặc email"}
                <input
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  autoComplete={mode === "register" ? "username" : "username"}
                  required
                  maxLength={80}
                />
              </label>
              <label>
                Mật khẩu
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  maxLength={128}
                />
              </label>
              {message && <p className="form-message error">{message}</p>}
              <button className="primary" type="submit" disabled={submitting}>
                {submitting ? "Đang xử lý..." : mode === "register" ? "Tạo tài khoản" : "Đăng nhập"}
              </button>
            </form>
            <button className="guest-login-button" type="button" onClick={continueAsGuest} disabled={submitting}>
              Tiếp tục với tư cách khách
            </button>
            <div className="login-divider"><span>hoặc</span></div>
            <a className="google-login-button" href={apiUrl("/api/auth/google?returnTo=/app")}>
              <span className="google-login-icon" aria-hidden="true">G</span>
              Tiếp tục với Google
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
