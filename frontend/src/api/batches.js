import api from './axiosInstance';
export const getBatches       = (params) => api.get('/batches', { params });
export const getBatch         = (id)     => api.get(`/batches/${id}`);
export const createBatch      = (data)   => api.post('/batches', data);
export const updateBatch      = (id, data) => api.put(`/batches/${id}`, data);
export const deleteBatch      = (id)     => api.delete(`/batches/${id}`);
export const getBatchProgress = (id)     => api.get(`/batches/${id}/progress`);
export const addProgress      = (id, data) => api.post(`/batches/${id}/progress`, data);
export const updateProgress   = (id, pid, data) => api.put(`/batches/${id}/progress/${pid}`, data);