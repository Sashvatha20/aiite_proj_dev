import api from './axiosInstance';

export const getFeeDetails = (studentId) => api.get(`/fee-payments/${studentId}`);

export const addPayment = (studentId, data) =>
  api.post(`/fee-payments/${studentId}`, data);

export const deletePayment = (paymentId) =>
  api.delete(`/fee-payments/${paymentId}`);