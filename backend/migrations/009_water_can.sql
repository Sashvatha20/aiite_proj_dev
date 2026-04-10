-- 009_water_can.sql
-- Creates WATER_CAN_DETAILS table

CREATE TYPE payment_status AS ENUM ('paid', 'balance', 'partial');

CREATE TABLE water_can_details (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date                DATE NOT NULL,
    no_of_ro_water      INT     DEFAULT 0,
    no_of_bisleri_water INT     DEFAULT 0,
    total_water_cans    INT     DEFAULT 0,
    amount              DECIMAL(8,2),
    paid_or_balance     payment_status DEFAULT 'paid',
    balance             DECIMAL(8,2)   DEFAULT 0,
    bisleri_price       DECIMAL(6,2)   DEFAULT 120,
    ro_price            DECIMAL(6,2)   DEFAULT 40,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);