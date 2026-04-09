import api from './axiosInstance';

export const getTodayStatus    = ()     => api.get('/attendance/today-status');
export const getMyAttendance   = (params) => api.get('/attendance/my', { params });
export const getEscalationsAgainstMe = () => api.get('/attendance/escalations/against-me');
export const checkin           = (data) => api.post('/attendance/checkin', data);
export const checkout          = (data) => api.post('/attendance/checkout', data);