import { apiUrl } from "../api.js";

export default function Landing() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Stickers riêng của bạn</p>
          <h1>Một tấm ảnh, cả bộ sticker.</h1>
          <p className="hero-lead">
            Tải ảnh lên và biến cá tính của bạn thành bộ sticker
            để dùng trong mọi cuộc trò chuyện.
          </p>
          <div className="cta-row">
            <a className="primary hero-cta" href={apiUrl("/api/auth/google?returnTo=/app")}>
              Truy cập ngay
            </a>
          </div>
        </div>

      </section>

    </main>
  );
}
