-- ============================================
-- 012: Attendance & Escalations
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in      TIMESTAMP,
  check_out     TIMESTAMP,
  ip_address    VARCHAR(60),
  status        VARCHAR(20) DEFAULT 'present'
                CHECK (status IN ('present','absent','late','half_day')),
  note          TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(trainer_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_trainer ON attendance(trainer_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date    ON attendance(date);

-- Escalations Table
CREATE TABLE IF NOT EXISTS escalations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raised_by     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  against       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  priority      VARCHAR(20) DEFAULT 'medium'
                CHECK (priority IN ('low','medium','high','critical')),
  status        VARCHAR(20) DEFAULT 'open'
                CHECK (status IN ('open','in_review','resolved','closed')),
  resolved_at   TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalations_against ON escalations(against);
CREATE INDEX IF NOT EXISTS idx_escalations_status  ON escalations(status);