import { Link } from 'react-router-dom';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Brand */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <span>COSMETICS</span>
              <span className="footer__logo-accent">PRO</span>
            </Link>
            <p className="footer__tagline">
              Mỹ phẩm chính hãng cao cấp — Chăm sóc vẻ đẹp tự nhiên của bạn.
            </p>
            <div className="footer__socials">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
                <i className="bi bi-facebook" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
                <i className="bi bi-instagram" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="Youtube">
                <i className="bi bi-youtube" />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok">
                <i className="bi bi-tiktok" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="footer__col">
            <h4 className="footer__heading">Mua sắm</h4>
            <ul className="footer__links">
              <li><Link to="/products">Tất cả sản phẩm</Link></li>
              <li><Link to="/products?new=true">Hàng mới về</Link></li>
              <li><Link to="/products?sale=true">Khuyến mãi</Link></li>
              <li><Link to="/products?category=skincare">Chăm sóc da</Link></li>
              <li><Link to="/products?category=makeup">Trang điểm</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div className="footer__col">
            <h4 className="footer__heading">Thông tin</h4>
            <ul className="footer__links">
              <li><Link to="/blog">Blog làm đẹp</Link></li>
              <li><a href="#">Về chúng tôi</a></li>
              <li><a href="#">Chính sách đổi trả</a></li>
              <li><a href="#">Hướng dẫn mua hàng</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__col">
            <h4 className="footer__heading">Liên hệ</h4>
            <ul className="footer__contact">
              <li>
                <i className="bi bi-geo-alt" />
                123 Nguyễn Huệ, Q.1, TP.HCM
              </li>
              <li>
                <i className="bi bi-telephone" />
                0909 123 456
              </li>
              <li>
                <i className="bi bi-envelope" />
                hello@HQCosmetic.vn
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© {year} HQCosmetic. Bảo lưu mọi quyền.</p>
          <div className="footer__bottom-links">
            <a href="#">Chính sách bảo mật</a>
            <a href="#">Điều khoản sử dụng</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
