import api from './axiosInstance';

export const getEscalations   = (params)   => api.get('/escalations', { params });
export const createEscalation = (data)     => api.post('/escalations', data);
export const updateEscalation = (id, data) => api.put(`/escalations/${id}`, data);