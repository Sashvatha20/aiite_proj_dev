import api from './axiosInstance';

export const getEnquiries = (params) => api.get('/enquiries', { params });
export const getEnquiry = (id) => api.get(`/enquiries/${id}`);
export const createEnquiry = (data) => api.post('/enquiries', data);
export const updateEnquiry = (id, data) => api.put(`/enquiries/${id}`, data);
export const deleteEnquiry = (id) => api.delete(`/enquiries/${id}`);
export const logFollowup = (id, data) => api.post(`/enquiries/${id}/followup`, data);
export const getFollowupHistory = (id) => api.get(`/enquiries/${id}/followups`);
export const saveDailyCount = (data) => api.post('/enquiries/count/daily', data);
export const getDailyCounts = () => api.get('/enquiries/count/daily');
export const convertToStudent = (id, data) => api.post(`/enquiries/${id}/convert`, data);
export const syncEnquiriesSheet = () => api.post('/sheets-sync/enquiries');
export const syncEnquiryFollowupsSheet = () => api.post('/sheets-sync/enquiry-followups');
export const syncEnquiryDailyCountSheet = () => api.post('/sheets-sync/enquiry-daily-count');