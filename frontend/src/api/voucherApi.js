import axiosClient from './axiosClient';

export const voucherApi = {
  validateVoucher: (code, order_value = 0) =>
    axiosClient.post('/vouchers/validate', { code, order_value }),
};
