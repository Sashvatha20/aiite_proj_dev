import api from './axiosInstance';
export const getDashboard     = ()       => api.get('/admin/dashboard');
export const getNotifications = ()       => api.get('/admin/notifications');
export const getTrainers      = ()       => api.get('/trainers');
export const getCourses       = ()       => api.get('/trainers/courses');