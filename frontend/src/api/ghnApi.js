import axios from 'axios';

const token = import.meta.env.VITE_GHN_TOKEN;
const shopId = Number(import.meta.env.VITE_GHN_SHOP_ID);
const fromDistrictId = Number(import.meta.env.VITE_GHN_FROM_DISTRICT_ID);

const ghnClient = axios.create({
  headers: {
    'Token': token,
    'Content-Type': 'application/json',
  },
});

export const ghnApi = {
  getProvinces: async () => {
    const res = await ghnClient.get('https://online-gateway.ghn.vn/shiip/public-api/master-data/province');
    return res.data;
  },
  
  getDistricts: async (province_id) => {
    const res = await ghnClient.get('https://online-gateway.ghn.vn/shiip/public-api/master-data/district', {
      params: { province_id }
    });
    return res.data;
  },

  getWards: async (district_id) => {
    const res = await ghnClient.get('https://online-gateway.ghn.vn/shiip/public-api/master-data/ward', {
      params: { district_id }
    });
    return res.data;
  },

  getAvailableServices: async (to_district) => {
    const res = await ghnClient.get('https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/available-services', {
      params: {
        shop_id: shopId,
        from_district: fromDistrictId,
        to_district,
      }
    });
    return res.data;
  },

  calculateFee: async ({ service_id, insurance_value, to_district_id, to_ward_code, weight = 1000, length = 15, width = 15, height = 15 }) => {
    const res = await ghnClient.post('https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee', {
      service_id,
      insurance_value,
      coupon: null,
      from_district_id: fromDistrictId,
      to_district_id,
      to_ward_code,
      weight,
      length,
      width,
      height,
    }, {
      headers: {
        'ShopId': shopId,
      }
    });
    return res.data;
  },
};
