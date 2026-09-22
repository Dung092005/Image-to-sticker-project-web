import { useState } from "react";
import { api, apiUrl } from "../api.js";

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openLogin() {
    setError("");
    setShowLogin(true);
  }

  function closeLogin() {
    if (isSubmitting) return;
    setShowLogin(false);
    setError("");
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      window.location.assign("/app");
    } catch (loginError) {
      setError(loginError.message || "Đăng nhập không thành công.");
    } finally {
      setIsSubmitting(false);
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
            <button className="primary hero-cta" type="button" onClick={openLogin}>
              Truy cập ngay
            </button>
          </div>
        </div>

      </section>

      {showLogin && (
        <div className="backdrop">
          <div className="login-card">
            <button className="close" type="button" onClick={closeLogin} disabled={isSubmitting}>
              ×
            </button>
            <h2>Bắt đầu với StickAI</h2>
            <p className="modal-intro">Đăng nhập bằng email và mật khẩu để tiếp tục.</p>
            <form onSubmit={handleLogin}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="ban@example.com"
                  required
                  disabled={isSubmitting}
                />
              </label>
              <label>
                Mật khẩu
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  required
                  disabled={isSubmitting}
                />
              </label>
              {error && <p className="form-message error">{error}</p>}
              <button className="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>
            </form>
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
