import { useState } from 'react';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="contact-page">

      {/* ── Hero ── */}
      <section className="contact-hero">
        <div className="contact-hero__overlay" />
        <div className="contact-hero__content">
          <p className="contact-hero__label">Hỗ trợ khách hàng</p>
          <h1 className="contact-hero__title">Liên hệ với chúng tôi</h1>
          <p className="contact-hero__desc">
            Đội ngũ tư vấn viên của HQCosmetic luôn sẵn sàng hỗ trợ bạn 7 ngày trong tuần.
          </p>
        </div>
      </section>

      {/* ── Info Cards ── */}
      <section className="contact-info-section">
        <div className="container">
          <div className="contact-info-grid">
            {[
              {
                icon: 'bi-geo-alt-fill',
                title: 'Địa chỉ',
                lines: ['123 Đường Nguyễn Huệ, Quận 1', 'TP. Hồ Chí Minh, Việt Nam'],
              },
              {
                icon: 'bi-clock-fill',
                title: 'Giờ làm việc',
                lines: ['Thứ 2 – Thứ 7: 8:00 – 21:00', 'Chủ nhật: 9:00 – 19:00'],
              },
              {
                icon: 'bi-telephone-fill',
                title: 'Điện thoại',
                lines: ['Hotline: 0909 123 456', 'Zalo: 0909 123 456'],
              },
              {
                icon: 'bi-envelope-fill',
                title: 'Email',
                lines: ['support@hqcosmetic.vn', 'sales@hqcosmetic.vn'],
              },
            ].map((card) => (
              <div key={card.title} className="contact-info-card">
                <div className="contact-info-card__icon">
                  <i className={`bi ${card.icon}`} />
                </div>
                <div>
                  <p className="contact-info-card__title">{card.title}</p>
                  {card.lines.map((l) => (
                    <p key={l} className="contact-info-card__line">{l}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form + Map ── */}
      <section className="contact-main-section">
        <div className="container">
          <div className="contact-main-grid">

            {/* Form */}
            <div className="contact-form-wrap">
              <div className="contact-form-header">
                <p className="contact-form-header__label">Gửi tin nhắn</p>
                <h2 className="contact-form-header__title">Chúng tôi sẽ phản hồi trong 24 giờ</h2>
              </div>

              {submitted ? (
                <div className="contact-success">
                  <div className="contact-success__icon">
                    <i className="bi bi-check-circle-fill" />
                  </div>
                  <h3 className="contact-success__title">Gửi thành công!</h3>
                  <p className="contact-success__desc">
                    Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể.
                  </p>
                  <button
                    className="contact-success__btn"
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                  >
                    Gửi tin nhắn khác
                  </button>
                </div>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit} id="contact-form">
                  <div className="contact-form__row">
                    <div className="contact-form__field">
                      <label htmlFor="contact-name">Họ và tên <span>*</span></label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        placeholder="Nguyễn Văn A"
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="contact-form__field">
                      <label htmlFor="contact-email">Email <span>*</span></label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        placeholder="example@email.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="contact-form__row">
                    <div className="contact-form__field">
                      <label htmlFor="contact-phone">Số điện thoại</label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        placeholder="0909 xxx xxx"
                        value={form.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="contact-form__field">
                      <label htmlFor="contact-subject">Chủ đề <span>*</span></label>
                      <select
                        id="contact-subject"
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        required
                      >
                        <option value="">-- Chọn chủ đề --</option>
                        <option value="order">Đơn hàng &amp; vận chuyển</option>
                        <option value="product">Tư vấn sản phẩm</option>
                        <option value="return">Đổi trả &amp; hoàn tiền</option>
                        <option value="account">Tài khoản</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div className="contact-form__field">
                    <label htmlFor="contact-message">Nội dung tin nhắn <span>*</span></label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      placeholder="Nhập nội dung bạn muốn hỏi hoặc phản hồi..."
                      value={form.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="contact-form__submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="contact-form__spinner" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send" />
                        Gửi tin nhắn
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Map */}
            <div className="contact-map-wrap">
              <div className="contact-map-header">
                <p className="contact-form-header__label">Tìm chúng tôi</p>
                <h2 className="contact-form-header__title">Ghé thăm cửa hàng</h2>
              </div>
              <div className="contact-map">
                <iframe
                  title="HQCosmetic Store Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4440979085!2d106.69868531411624!3d10.77720146225!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4670702e31%3A0xa5777f9c3eb5c0!2zTmd1eeG7hW4gSHXhu4csIELhur9uIE5naOOpLCBRdeG6rW4gMSwgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oLCBWaWV0bmFt!5e0!3m2!1svi!2s!4v1695000000000!5m2!1svi!2s"
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              {/* Social */}
              <div className="contact-social">
                <p className="contact-social__label">Kết nối với chúng tôi</p>
                <div className="contact-social__links">
                  {[
                    { icon: 'bi-facebook', label: 'Facebook', href: '#' },
                    { icon: 'bi-instagram', label: 'Instagram', href: '#' },
                    { icon: 'bi-tiktok', label: 'TikTok', href: '#' },
                    { icon: 'bi-youtube', label: 'YouTube', href: '#' },
                  ].map((s) => (
                    <a key={s.label} href={s.href} className="contact-social__link" aria-label={s.label} target="_blank" rel="noreferrer">
                      <i className={`bi ${s.icon}`} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default ContactPage;
