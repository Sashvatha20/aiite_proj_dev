import api from './axiosInstance';
export const getDashboard    = ()       => api.get('/admin/dashboard');
export const getTrainerStats = (params) => api.get('/admin/trainers', { params });