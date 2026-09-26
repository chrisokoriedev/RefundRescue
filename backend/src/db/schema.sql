CREATE TABLE IF NOT EXISTS recovery_logs (
    id UUID PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    scenario VARCHAR(50) NOT NULL,
    mrr DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    plan_id VARCHAR(255),
    call_run_id VARCHAR(255),
    outcome TEXT,
    churn_reason TEXT,
    prompt TEXT,
    stripe_event_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index for idempotency lookups
CREATE INDEX IF NOT EXISTS idx_recovery_logs_stripe_event_id
    ON recovery_logs (stripe_event_id);

-- Index for status-based queries (dashboard metrics)
CREATE INDEX IF NOT EXISTS idx_recovery_logs_status
    ON recovery_logs (status);
