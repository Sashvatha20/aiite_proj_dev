-- 008_followups_placements.sql
-- Creates STUDENT_FOLLOWUPS and PLACEMENTS tables

CREATE TYPE followup_type   AS ENUM ('project', 'playwright', 'general');
CREATE TYPE placement_status AS ENUM ('placed', 'offer_pending', 'rejected', 'in_process');
CREATE TYPE call_status     AS ENUM ('picked', 'not_picked', 'busy');

CREATE TABLE student_followups (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id            UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    followup_type         followup_type NOT NULL DEFAULT 'general',
    call_status           call_status,
    last_contact_date     DATE,
    remarks               TEXT,
    resume_status         VARCHAR(100),
    no_of_interview_calls INT  DEFAULT 0,
    no_of_rounds_cleared  INT  DEFAULT 0,
    interested            BOOLEAN,
    placed_status         placement_status,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE placements (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    company_name      VARCHAR(200),
    role_offered      VARCHAR(200),
    placed_as         VARCHAR(200),
    cooperation_mode  BOOLEAN DEFAULT false,
    rounds_cleared    INT     DEFAULT 0,
    placed_status     placement_status NOT NULL DEFAULT 'in_process',
    placed_date       DATE,
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);