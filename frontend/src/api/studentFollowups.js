import api from './axiosInstance';
export const getFollowups    = (params) => api.get('/followups', { params });
export const createFollowup  = (data)   => api.post('/followups', data);
export const updateFollowup  = (id, data) => api.put(`/followups/${id}`, data);