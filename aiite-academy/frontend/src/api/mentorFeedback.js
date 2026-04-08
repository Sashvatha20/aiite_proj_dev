import api from './axiosInstance';
export const getMentorFeedbacks  = (params) => api.get('/mentor-feedback', { params });
export const createMentorFeedback = (data)  => api.post('/mentor-feedback', data);
export const updateMentorFeedback = (id, data) => api.put(`/mentor-feedback/${id}`, data);