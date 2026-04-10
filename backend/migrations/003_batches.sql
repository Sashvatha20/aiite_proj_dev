-- 003_batches.sql
-- Creates BATCHES, BATCH_TRAINERS, BATCH_PROGRESS tables

CREATE TYPE weekday_weekend_type AS ENUM ('weekday', 'weekend', 'both');
CREATE TYPE session_type         AS ENUM ('regular', 'crash', 'recorded');
CREATE TYPE batch_status         AS ENUM ('upcoming', 'ongoing', 'completed', 'cancelled');
CREATE TYPE phase_type           AS ENUM ('phase_1', 'phase_2', 'phase_3', 'project', 'completed');
CREATE TYPE batch_trainer_role   AS ENUM ('primary', 'secondary', 'guest');

CREATE TABLE batches (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_name       VARCHAR(200) NOT NULL,
    course_id        UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    batch_start_date DATE,
    batch_end_date   DATE,
    weekday_weekend  weekday_weekend_type,
    session_type     session_type,
    timing           VARCHAR(50),
    status           batch_status NOT NULL DEFAULT 'upcoming',
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE batch_trainers (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id     UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    trainer_id   UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    role_in_batch batch_trainer_role DEFAULT 'primary',
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(batch_id, trainer_id)
);

CREATE TABLE batch_progress (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id              UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    progress_date         DATE NOT NULL,
    last_topic_covered    VARCHAR(300),
    session_hours         DECIMAL(4,2),
    phase                 phase_type,
    phase_completion_date DATE,
    next_phase_start_date DATE,
    remarks               TEXT,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);