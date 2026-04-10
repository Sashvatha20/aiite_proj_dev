import api from './axiosInstance';
export const getMyLogs    = (params)   => api.get('/worklog', { params });
export const getAllLogs   = (params)   => api.get('/worklog/all', { params });
export const getLogStats  = (params)   => api.get('/worklog/stats', { params });
export const submitLog    = (data)     => api.post('/worklog', data);
export const updateLog    = (id, data) => api.put(`/worklog/${id}`, data);