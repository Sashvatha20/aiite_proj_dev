-- 005_mentor_assessment.sql
-- Creates MENTOR_FEEDBACK and BATCH_ASSESSMENT tables

CREATE TYPE feedback_rating AS ENUM ('excellent', 'good', 'average', 'needs_improvement');

CREATE TABLE mentor_feedback (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id          UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    trainer_id        UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    total_members     INT,
    form_shared       BOOLEAN DEFAULT false,
    received_response INT     DEFAULT 0,
    pending           INT     DEFAULT 0,
    followup_notes    TEXT,
    google_form_link  VARCHAR(500),
    last_updated_date DATE,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE batch_assessment (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id             UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    student_id           UUID REFERENCES students(id) ON DELETE SET NULL,
    assessment_date      DATE NOT NULL,
    session_type         session_type,
    weekday_weekend      weekday_weekend_type,
    topic_covered        VARCHAR(300),
    no_of_participants   INT,
    session_hours        DECIMAL(4,2),
    question             TEXT,
    no_of_questions_asked INT,
    feedback_rating      feedback_rating,
    outcome_remarks      TEXT,
    created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMP NOT NULL DEFAULT NOW()
);