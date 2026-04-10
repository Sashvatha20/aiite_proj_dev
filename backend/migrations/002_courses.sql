-- 002_courses.sql
-- Creates COURSES and COURSE_TRAINERS tables

CREATE TYPE course_mode AS ENUM ('online', 'offline', 'hybrid');
CREATE TYPE brochure_status AS ENUM ('available', 'pending', 'not_needed');

CREATE TABLE courses (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_name       VARCHAR(200) NOT NULL,
    fee               DECIMAL(10,2),
    duration          VARCHAR(100),
    mode              course_mode,
    brochure_available BOOLEAN     DEFAULT false,
    content_given     BOOLEAN      DEFAULT false,
    brochure_status   brochure_status DEFAULT 'pending',
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE course_trainers (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(course_id, trainer_id)
);