import api from './axiosInstance';
export const getAssessments  = (params) => api.get('/assessments', { params });
export const createAssessment = (data)  => api.post('/assessments', data);
export const updateAssessment = (id, data) => api.put(`/assessments/${id}`, data);