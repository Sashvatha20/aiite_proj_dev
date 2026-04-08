import api from './axiosInstance';
export const getEnquiries    = (params)    => api.get('/enquiries', { params });
export const getEnquiry      = (id)        => api.get(`/enquiries/${id}`);
export const createEnquiry   = (data)      => api.post('/enquiries', data);
export const updateEnquiry   = (id, data)  => api.put(`/enquiries/${id}`, data);
export const deleteEnquiry   = (id)        => api.delete(`/enquiries/${id}`);
export const logFollowup     = (id, data)  => api.post(`/enquiries/${id}/followup`, data);
export const saveDailyCount  = (data)      => api.post('/enquiries/daily-count', data);
export const getDailyCounts  = ()          => api.get('/enquiries/daily-count/list');