import { useState } from "react";
import { api, apiUrl } from "../api.js";

export default function Landing({ onGuestLogin }) {
  const [showLogin, setShowLogin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openLogin() {
    setError("");
    setIsRegistering(false);
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
      await api(isRegistering ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegistering ? { name, email, password } : { email, password },
        ),
      });
      window.location.assign("/app");
    } catch (loginError) {
      setError(loginError.message || "Thao tác không thành công.");
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
            <button className="guest-cta" type="button" onClick={() => {
              onGuestLogin();
              window.location.assign("/app");
            }}>
              Tiếp tục với tư cách khách
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
            <p className="modal-intro">
              {isRegistering
                ? "Tạo tài khoản bằng email bất kỳ và mật khẩu của bạn."
                : "Đăng nhập bằng email và mật khẩu để tiếp tục."}
            </p>
            <form onSubmit={handleLogin}>
              {isRegistering && (
                <label>
                  Tên hiển thị
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    placeholder="Tên của bạn"
                    minLength={2}
                    maxLength={80}
                    required
                    disabled={isSubmitting}
                  />
                </label>
              )}
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
                {isSubmitting
                  ? isRegistering
                    ? "Đang đăng ký..."
                    : "Đang đăng nhập..."
                  : isRegistering
                    ? "Đăng ký"
                    : "Đăng nhập"}
              </button>
            </form>
            <button
              className="login-switch"
              type="button"
              onClick={() => {
                setIsRegistering((registering) => !registering);
                setError("");
              }}
              disabled={isSubmitting}
            >
              {isRegistering ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"}
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
