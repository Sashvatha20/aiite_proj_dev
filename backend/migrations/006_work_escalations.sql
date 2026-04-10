-- 006_work_escalations.sql
-- Creates DAILY_WORK_LOG and ESCALATIONS tables

CREATE TYPE escalation_status AS ENUM ('open', 'acknowledged', 'resolved');

CREATE TABLE daily_work_log (
    id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trainer_id               UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    batch_id                 UUID REFERENCES batches(id) ON DELETE SET NULL,
    log_date                 DATE NOT NULL,
    work_description         TEXT,
    progressive_working_hours DECIMAL(4,2),
    star_points              DECIMAL(6,2),
    whatsapp_sent_to         VARCHAR(200),
    wa_sent                  BOOLEAN DEFAULT false,
    created_at               TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE escalations (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escalation_date  DATE NOT NULL,
    trainer_id       UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    reported_by      VARCHAR(150),
    description      TEXT,
    no_of_count      INT DEFAULT 1,
    status           escalation_status NOT NULL DEFAULT 'open',
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);