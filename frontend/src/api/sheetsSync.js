import api from './axiosInstance';

export const syncStudentsSheet = () => api.post('/sheets-sync/students');
export const syncStudentFollowupsSheet = () => api.post('/sheets-sync/student-followups');
export const syncBatchesSheet = () => api.post('/sheets-sync/batches');
export const syncBatchProgressSheet = () => api.post('/sheets-sync/batch-progress');
export const syncWorkLogSheet = () => api.post('/sheets-sync/worklog');
export const syncMentorFeedbackSheet = () => api.post('/sheets-sync/mentor-feedback');