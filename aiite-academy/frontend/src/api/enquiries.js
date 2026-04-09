import api from './axiosInstance';

export const getEnquiries   = (params)   => api.get('/enquiries', { params });
export const getEnquiry     = (id)       => api.get(`/enquiries/${id}`);
export const createEnquiry  = (data)     => api.post('/enquiries', data);
export const updateEnquiry  = (id, data) => api.put(`/enquiries/${id}`, data);
export const deleteEnquiry  = (id)       => api.delete(`/enquiries/${id}`);
export const logFollowup    = (id, data) => api.post(`/enquiries/${id}/followup`, data);
export const getFollowupHistory = (id)   => api.get(`/enquiries/${id}/followups`);

// ✅ Fixed — match backend route: /enquiries/count/daily
export const saveDailyCount = (data)     => api.post('/enquiries/count/daily', data);
export const getDailyCounts = ()         => api.get('/enquiries/count/daily');