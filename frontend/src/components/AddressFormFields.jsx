import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const PROVINCES_API = 'https://provinces.open-api.vn/api';

/**
 * AddressFormFields - Component chọn địa chỉ Tỉnh/Thành → Quận/Huyện → Phường/Xã
 * Props:
 *   - onAddressChange(addressString) : callback khi địa chỉ thay đổi, trả về chuỗi đầy đủ
 *   - defaultStreet : giá trị mặc định cho ô số nhà/đường
 */
const AddressFormFields = ({ onAddressChange, defaultStreet = '' }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [street, setStreet] = useState(defaultStreet);

  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    axios.get(`${PROVINCES_API}/p/`)
      .then((res) => setProvinces(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingProvinces(false));
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setWards([]);
      return;
    }
    setLoadingDistricts(true);
    setDistricts([]);
    setWards([]);
    setSelectedDistrict(null);
    setSelectedWard(null);

    axios.get(`${PROVINCES_API}/p/${selectedProvince.code}?depth=2`)
      .then((res) => setDistricts(res.data?.districts || []))
      .catch(() => {})
      .finally(() => setLoadingDistricts(false));
  }, [selectedProvince]);

  // Load wards when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      return;
    }
    setLoadingWards(true);
    setWards([]);
    setSelectedWard(null);

    axios.get(`${PROVINCES_API}/d/${selectedDistrict.code}?depth=2`)
      .then((res) => setWards(res.data?.wards || []))
      .catch(() => {})
      .finally(() => setLoadingWards(false));
  }, [selectedDistrict]);

  // Build full address string and notify parent
  const buildAddress = useCallback(() => {
    const parts = [];
    if (street.trim()) parts.push(street.trim());
    if (selectedWard) parts.push(selectedWard.name);
    if (selectedDistrict) parts.push(selectedDistrict.name);
    if (selectedProvince) parts.push(selectedProvince.name);
    return parts.join(', ');
  }, [street, selectedWard, selectedDistrict, selectedProvince]);

  useEffect(() => {
    if (onAddressChange) {
      onAddressChange(buildAddress());
    }
  }, [buildAddress, onAddressChange]);

  const handleProvinceChange = (e) => {
    const code = parseInt(e.target.value);
    const province = provinces.find((p) => p.code === code);
    setSelectedProvince(province || null);
  };

  const handleDistrictChange = (e) => {
    const code = parseInt(e.target.value);
    const district = districts.find((d) => d.code === code);
    setSelectedDistrict(district || null);
  };

  const handleWardChange = (e) => {
    const code = parseInt(e.target.value);
    const ward = wards.find((w) => w.code === code);
    setSelectedWard(ward || null);
  };

  return (
    <div className="address-fields">
      {/* Row 1: Province & District */}
      <div className="address-fields__row">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Tỉnh / Thành phố <span style={{ color: 'var(--color-error)' }}>*</span></label>
          <select
            className="form-select"
            value={selectedProvince?.code || ''}
            onChange={handleProvinceChange}
            disabled={loadingProvinces}
          >
            <option value="">
              {loadingProvinces ? 'Đang tải...' : '-- Chọn tỉnh/thành --'}
            </option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Quận / Huyện <span style={{ color: 'var(--color-error)' }}>*</span></label>
          <select
            className="form-select"
            value={selectedDistrict?.code || ''}
            onChange={handleDistrictChange}
            disabled={!selectedProvince || loadingDistricts}
          >
            <option value="">
              {loadingDistricts ? 'Đang tải...' : !selectedProvince ? '-- Chọn tỉnh trước --' : '-- Chọn quận/huyện --'}
            </option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Ward & Street */}
      <div className="address-fields__row">
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Phường / Xã <span style={{ color: 'var(--color-error)' }}>*</span></label>
          <select
            className="form-select"
            value={selectedWard?.code || ''}
            onChange={handleWardChange}
            disabled={!selectedDistrict || loadingWards}
          >
            <option value="">
              {loadingWards ? 'Đang tải...' : !selectedDistrict ? '-- Chọn quận trước --' : '-- Chọn phường/xã --'}
            </option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>{w.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Số nhà, tên đường <span style={{ color: 'var(--color-error)' }}>*</span></label>
          <input
            className="form-input"
            placeholder="VD: 123 Nguyễn Huệ"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default AddressFormFields;
