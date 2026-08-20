/**
 * AddressFormFields — Chọn địa chỉ 3 cấp sử dụng API v2
 * API: https://provinces.open-api.vn/api/v2/
 *
 * Cấu trúc API v2:
 *   GET /p/?limit=63                → Danh sách tỉnh/thành (63 tỉnh)
 *   GET /p/{province_code}?depth=2  → Thông tin tỉnh kèm wards[]
 *   GET /w/{ward_code}              → Chi tiết phường/xã
 *
 * Lưu ý: API v2 đã bỏ cấp "quận/huyện" riêng,
 * wards được gắn trực tiếp vào province với province_code.
 *
 * Props:
 *   onAddressChange(string) — callback trả về chuỗi địa chỉ đầy đủ khi thay đổi
 */
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BASE = 'https://provinces.open-api.vn/api/v2';

/* Tạo axios instance riêng để tránh ảnh hưởng interceptor của app */
const geoApi = axios.create({ baseURL: BASE, timeout: 10000 });

/* ── Helpers ── */
const sortByName = (arr) => [...arr].sort((a, b) => a.name.localeCompare(b.name, 'vi'));

const AddressFormFields = ({ onAddressChange }) => {
  /* ── State ── */
  const [provinces, setProvinces] = useState([]);
  const [wards,     setWards]     = useState([]);

  const [province, setProvince] = useState(null);  // { code, name, ... }
  const [ward,     setWard]     = useState(null);   // { code, name, ... }

  const [loadingP,  setLoadingP]  = useState(true);
  const [loadingW,  setLoadingW]  = useState(false);
  const [errorP,    setErrorP]    = useState('');
  const [errorW,    setErrorW]    = useState('');

  /* Dùng ref để tránh stale closure trong callback */
  const callbackRef = useRef(onAddressChange);
  useEffect(() => { callbackRef.current = onAddressChange; }, [onAddressChange]);

  /* ── 1. Load tất cả tỉnh/thành khi mount ── */
  useEffect(() => {
    setLoadingP(true);
    setErrorP('');
    geoApi.get('/p/?limit=63')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setProvinces(sortByName(data));
      })
      .catch(() => setErrorP('Không tải được danh sách tỉnh/thành. Vui lòng tải lại trang.'))
      .finally(() => setLoadingP(false));
  }, []);

  /* ── 2. Load wards khi chọn tỉnh ── */
  useEffect(() => {
    if (!province) {
      setWards([]);
      setWard(null);
      callbackRef.current?.('');
      return;
    }

    setLoadingW(true);
    setErrorW('');
    setWards([]);
    setWard(null);

    /* API v2: GET /p/{code}?depth=2 → { name, code, wards: [...] } */
    geoApi.get(`/p/${province.code}?depth=2`)
      .then((res) => {
        const wardsData = Array.isArray(res.data?.wards) ? res.data.wards : [];
        setWards(sortByName(wardsData));
      })
      .catch(() => setErrorW('Không tải được danh sách phường/xã.'))
      .finally(() => setLoadingW(false));
  }, [province]);

  /* ── 3. Notify parent khi địa chỉ thay đổi ── */
  useEffect(() => {
    if (!province) { callbackRef.current?.(''); return; }
    const parts = [];
    if (ward)     parts.push(ward.name);
    parts.push(province.name);
    callbackRef.current?.(parts.join(', '));
  }, [province, ward]);

  /* ── Handlers ── */
  const handleProvinceChange = (e) => {
    const code = Number(e.target.value);
    setProvince(provinces.find((p) => p.code === code) || null);
  };

  const handleWardChange = (e) => {
    const code = Number(e.target.value);
    setWard(wards.find((w) => w.code === code) || null);
  };

  /* ── Render ── */
  return (
    <div className="address-fields">
      {/* ─── Tỉnh / Thành phố ─── */}
      <div className="form-group">
        <label className="form-label">
          Tỉnh / Thành phố <span style={{ color: 'var(--color-error)' }}>*</span>
        </label>

        {errorP ? (
          <div className="address-fields__error">
            <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 13 }} />
            {errorP}
            <button
              type="button"
              className="address-fields__retry"
              onClick={() => window.location.reload()}
            >Tải lại</button>
          </div>
        ) : (
          <div className="address-fields__select-wrap">
            <select
              className="form-select"
              value={province?.code ?? ''}
              onChange={handleProvinceChange}
              disabled={loadingP}
            >
              <option value="">
                {loadingP ? '⏳ Đang tải tỉnh/thành...' : '-- Chọn Tỉnh / Thành phố --'}
              </option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
            {loadingP && <span className="address-fields__spinner" />}
          </div>
        )}
      </div>

      {/* ─── Phường / Xã / Thị trấn ─── */}
      <div className="form-group">
        <label className="form-label">
          Phường / Xã / Thị trấn <span style={{ color: 'var(--color-error)' }}>*</span>
        </label>

        {errorW ? (
          <div className="address-fields__error">
            <i className="bi bi-exclamation-circle-fill" style={{ fontSize: 13 }} />
            {errorW}
          </div>
        ) : (
          <div className="address-fields__select-wrap">
            <select
              className="form-select"
              value={ward?.code ?? ''}
              onChange={handleWardChange}
              disabled={!province || loadingW}
            >
              <option value="">
                {loadingW
                  ? '⏳ Đang tải phường/xã...'
                  : !province
                    ? '-- Chọn tỉnh/thành trước --'
                    : `-- Chọn Phường / Xã (${wards.length} khu vực) --`}
              </option>
              {wards.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name}
                </option>
              ))}
            </select>
            {loadingW && <span className="address-fields__spinner" />}
          </div>
        )}
      </div>

      {/* ─── Preview địa chỉ đã chọn ─── */}
      {ward && province && (
        <div className="address-fields__preview">
          <i className="bi bi-geo-alt-fill" style={{ fontSize: 13 }} />
          <span>
            {ward.name}, {province.name}
          </span>
          <span className="address-fields__preview-type">
            ({ward.division_type})
          </span>
        </div>
      )}
    </div>
  );
};

export default AddressFormFields;
