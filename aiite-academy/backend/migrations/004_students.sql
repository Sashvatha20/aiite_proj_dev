-- 004_students.sql
-- Creates STUDENTS table

CREATE TABLE students (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id       UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    candidate_name VARCHAR(200) NOT NULL,
    phone          VARCHAR(20),
    email          VARCHAR(200),
    whatsapp_number VARCHAR(20),
    certificate_no VARCHAR(50) UNIQUE,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);