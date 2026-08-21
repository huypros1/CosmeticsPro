import { useState, useEffect, useRef } from 'react';
import { ghnApi } from '../api/ghnApi';

const sortByName = (arr) => {
  if (!arr) return [];
  return [...arr].sort((a, b) => {
    const nameA = a.ProvinceName || a.DistrictName || a.WardName || '';
    const nameB = b.ProvinceName || b.DistrictName || b.WardName || '';
    return nameA.localeCompare(nameB, 'vi');
  });
};

const AddressFormFields = ({ onAddressChange, onLocationSelect }) => {
  /* ── State ── */
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards,     setWards]     = useState([]);

  const [province, setProvince] = useState(null);
  const [district, setDistrict] = useState(null);
  const [ward,     setWard]     = useState(null);

  const [loadingP,  setLoadingP]  = useState(true);
  const [loadingD,  setLoadingD]  = useState(false);
  const [loadingW,  setLoadingW]  = useState(false);

  const [errorP,    setErrorP]    = useState('');
  const [errorD,    setErrorD]    = useState('');
  const [errorW,    setErrorW]    = useState('');

  const callbackRef = useRef(onAddressChange);
  const locationCbRef = useRef(onLocationSelect);
  useEffect(() => { callbackRef.current = onAddressChange; }, [onAddressChange]);
  useEffect(() => { locationCbRef.current = onLocationSelect; }, [onLocationSelect]);

  /* ── 1. Load Tỉnh/Thành phố khi mount ── */
  useEffect(() => {
    setLoadingP(true);
    setErrorP('');
    ghnApi.getProvinces()
      .then((res) => {
        setProvinces(sortByName(res.data));
      })
      .catch(() => setErrorP('Không tải được danh sách tỉnh/thành.'))
      .finally(() => setLoadingP(false));
  }, []);

  /* ── 2. Load Quận/Huyện khi chọn Tỉnh ── */
  useEffect(() => {
    if (!province) {
      setDistricts([]);
      setDistrict(null);
      return;
    }
    setLoadingD(true);
    setErrorD('');
    setDistricts([]);
    setDistrict(null);

    ghnApi.getDistricts(province.ProvinceID)
      .then((res) => setDistricts(sortByName(res.data)))
      .catch(() => setErrorD('Không tải được danh sách quận/huyện.'))
      .finally(() => setLoadingD(false));
  }, [province]);

  /* ── 3. Load Phường/Xã khi chọn Quận ── */
  useEffect(() => {
    if (!district) {
      setWards([]);
      setWard(null);
      return;
    }
    setLoadingW(true);
    setErrorW('');
    setWards([]);
    setWard(null);

    ghnApi.getWards(district.DistrictID)
      .then((res) => setWards(sortByName(res.data)))
      .catch(() => setErrorW('Không tải được danh sách phường/xã.'))
      .finally(() => setLoadingW(false));
  }, [district]);

  /* ── 4. Notify parent khi địa chỉ thay đổi ── */
  useEffect(() => {
    if (!province) { 
      callbackRef.current?.(''); 
      locationCbRef.current?.(null);
      return; 
    }
    const parts = [];
    if (ward)     parts.push(ward.WardName);
    if (district) parts.push(district.DistrictName);
    parts.push(province.ProvinceName);
    
    callbackRef.current?.(parts.join(', '));

    if (province && district && ward) {
      locationCbRef.current?.({
        province_id: province.ProvinceID,
        district_id: district.DistrictID,
        ward_code: ward.WardCode
      });
    } else {
      locationCbRef.current?.(null);
    }
  }, [province, district, ward]);

  /* ── Handlers ── */
  const handleProvinceChange = (e) => {
    const id = Number(e.target.value);
    setProvince(provinces.find((p) => p.ProvinceID === id) || null);
  };

  const handleDistrictChange = (e) => {
    const id = Number(e.target.value);
    setDistrict(districts.find((d) => d.DistrictID === id) || null);
  };

  const handleWardChange = (e) => {
    const code = e.target.value; // WardCode is string
    setWard(wards.find((w) => w.WardCode === code) || null);
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
          <div className="address-fields__error">{errorP}</div>
        ) : (
          <div className="address-fields__select-wrap">
            <select
              className="form-select"
              value={province?.ProvinceID ?? ''}
              onChange={handleProvinceChange}
              disabled={loadingP}
            >
              <option value="">{loadingP ? '⏳ Đang tải...' : '-- Chọn Tỉnh / Thành phố --'}</option>
              {provinces.map((p) => (
                <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ─── Quận / Huyện ─── */}
      <div className="form-group">
        <label className="form-label">
          Quận / Huyện <span style={{ color: 'var(--color-error)' }}>*</span>
        </label>
        {errorD ? (
          <div className="address-fields__error">{errorD}</div>
        ) : (
          <div className="address-fields__select-wrap">
            <select
              className="form-select"
              value={district?.DistrictID ?? ''}
              onChange={handleDistrictChange}
              disabled={!province || loadingD}
            >
              <option value="">
                {loadingD ? '⏳ Đang tải...' : !province ? '-- Chọn tỉnh/thành trước --' : '-- Chọn Quận / Huyện --'}
              </option>
              {districts.map((d) => (
                <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ─── Phường / Xã ─── */}
      <div className="form-group">
        <label className="form-label">
          Phường / Xã <span style={{ color: 'var(--color-error)' }}>*</span>
        </label>
        {errorW ? (
          <div className="address-fields__error">{errorW}</div>
        ) : (
          <div className="address-fields__select-wrap">
            <select
              className="form-select"
              value={ward?.WardCode ?? ''}
              onChange={handleWardChange}
              disabled={!district || loadingW}
            >
              <option value="">
                {loadingW ? '⏳ Đang tải...' : !district ? '-- Chọn quận/huyện trước --' : '-- Chọn Phường / Xã --'}
              </option>
              {wards.map((w) => (
                <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ─── Preview địa chỉ đã chọn ─── */}
      {ward && district && province && (
        <div className="address-fields__preview" style={{ fontSize: 13, color: 'var(--color-success)', marginTop: 8 }}>
          <i className="bi bi-geo-alt-fill" style={{ marginRight: 6 }} />
          {ward.WardName}, {district.DistrictName}, {province.ProvinceName}
        </div>
      )}
    </div>
  );
};

export default AddressFormFields;
