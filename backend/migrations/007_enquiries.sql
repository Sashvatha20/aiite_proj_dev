-- 007_enquiries.sql
-- Creates ENQUIRIES, ENQUIRY_FOLLOWUPS, ENQUIRY_DAILY_COUNT tables

CREATE TYPE enquiry_mode   AS ENUM ('call', 'walk_in', 'online', 'referral');
CREATE TYPE enquiry_status AS ENUM ('new', 'followup', 'converted', 'not_interested', 'closed');
CREATE TYPE list_type      AS ENUM ('daily_followup', 'batch_allocated', 'not_interested');
CREATE TYPE ticket_status  AS ENUM ('open', 'closed', 'pending');
CREATE TYPE batch_avail    AS ENUM ('available', 'full', 'upcoming');

CREATE TABLE enquiries (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assigned_trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
    date                DATE NOT NULL,
    name                VARCHAR(200) NOT NULL,
    contact             VARCHAR(20),
    course_enquired_for VARCHAR(200),
    course_suggested    VARCHAR(200),
    enquiry_mode        enquiry_mode,
    source              VARCHAR(100),
    referred_by         VARCHAR(200),
    list_type           list_type,
    status              enquiry_status NOT NULL DEFAULT 'new',
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE enquiry_followups (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enquiry_id         UUID NOT NULL REFERENCES enquiries(id) ON DELETE CASCADE,
    followup_date      DATE NOT NULL,
    call_picked        BOOLEAN DEFAULT false,
    last_response      TEXT,
    ticket_status      ticket_status DEFAULT 'open',
    details_pitched    BOOLEAN DEFAULT false,
    call_attempt_number INT,
    remarks            TEXT,
    batch_status       batch_avail,
    created_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE enquiry_daily_count (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date                  DATE NOT NULL UNIQUE,
    call_enquiries        INT  DEFAULT 0,
    walk_in_enquiries     INT  DEFAULT 0,
    total_enquiries       INT  DEFAULT 0,
    course_suggested_by_us VARCHAR(200),
    remarks               TEXT,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);