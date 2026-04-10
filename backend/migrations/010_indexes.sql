-- 010_indexes.sql
-- Performance indexes for all foreign keys and frequent queries

-- Foreign key indexes
CREATE INDEX idx_trainers_user_id        ON trainers(user_id);
CREATE INDEX idx_course_trainers_course  ON course_trainers(course_id);
CREATE INDEX idx_course_trainers_trainer ON course_trainers(trainer_id);
CREATE INDEX idx_batches_course_id       ON batches(course_id);
CREATE INDEX idx_batch_trainers_batch    ON batch_trainers(batch_id);
CREATE INDEX idx_batch_trainers_trainer  ON batch_trainers(trainer_id);
CREATE INDEX idx_batch_progress_batch    ON batch_progress(batch_id);
CREATE INDEX idx_students_batch_id       ON students(batch_id);
CREATE INDEX idx_mentor_feedback_batch   ON mentor_feedback(batch_id);
CREATE INDEX idx_assessment_batch        ON batch_assessment(batch_id);
CREATE INDEX idx_assessment_student      ON batch_assessment(student_id);
CREATE INDEX idx_worklog_trainer         ON daily_work_log(trainer_id);
CREATE INDEX idx_worklog_batch           ON daily_work_log(batch_id);
CREATE INDEX idx_escalations_trainer     ON escalations(trainer_id);
CREATE INDEX idx_enquiry_trainer         ON enquiries(assigned_trainer_id);
CREATE INDEX idx_enquiry_followups       ON enquiry_followups(enquiry_id);
CREATE INDEX idx_student_followups       ON student_followups(student_id);
CREATE INDEX idx_placements_student      ON placements(student_id);

-- Date-based indexes for dashboard queries
CREATE INDEX idx_worklog_date            ON daily_work_log(log_date);
CREATE INDEX idx_enquiry_date            ON enquiries(date);
CREATE INDEX idx_enquiry_count_date      ON enquiry_daily_count(date);
CREATE INDEX idx_escalation_date         ON escalations(escalation_date);
CREATE INDEX idx_water_can_date          ON water_can_details(date);