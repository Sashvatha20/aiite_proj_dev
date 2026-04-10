import api from './axiosInstance';
export const getWaterEntries = (params)   => api.get('/watercan', { params });
export const getWaterStats   = (params)   => api.get('/watercan/stats', { params });
export const createWaterEntry = (data)    => api.post('/watercan', data);
export const updateWaterEntry = (id, data) => api.put(`/watercan/${id}`, data);
export const deleteWaterEntry = (id)      => api.delete(`/watercan/${id}`);