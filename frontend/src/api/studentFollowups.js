import api from './axiosInstance';

export const getFollowups = (params = {}) => {
  return api.get('/student-followups', { params });
};

export const getFollowupHistory = (studentId) => {
  return api.get(`/student-followups/${studentId}/history`);
};

export const createFollowup = (payload) => {
  return api.post('/student-followups', payload);
};

export const updateFollowup = (id, payload) => {
  return api.put(`/student-followups/${id}`, payload);
};

export const syncStudentFollowupsSheet = () => {
  return api.post('/sheets-sync/student-followups');
};

export default {
  getFollowups,
  getFollowupHistory,
  createFollowup,
  updateFollowup,
  syncStudentFollowupsSheet,
};