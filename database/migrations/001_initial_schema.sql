-- WatsonX Nodes — PostgreSQL Schema
-- Run this file to initialize the database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Nodes ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nodes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(150) NOT NULL,
  description TEXT,
  category    VARCHAR(100),
  is_public   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Updates (Posts) ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS updates (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id         UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  author_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  schedule_type   VARCHAR(30) NOT NULL DEFAULT 'immediate'
                  CHECK (schedule_type IN ('immediate', 'specific_datetime', 'specific_days', 'every_x_days')),
  schedule_config JSONB NOT NULL DEFAULT '{}',
  posted_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─── Subscriptions ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  node_id        UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  channel        VARCHAR(20) NOT NULL CHECK (channel IN ('teams', 'slack', 'whatsapp')),
  channel_config JSONB NOT NULL DEFAULT '{}',
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, node_id)
);

-- ─── Notifications ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  update_id       UUID NOT NULL REFERENCES updates(id) ON DELETE CASCADE,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message   TEXT,
  sent_at         TIMESTAMP WITH TIME ZONE
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_nodes_owner        ON nodes(owner_id);
CREATE INDEX IF NOT EXISTS idx_updates_node       ON updates(node_id);
CREATE INDEX IF NOT EXISTS idx_updates_status     ON updates(status);
CREATE INDEX IF NOT EXISTS idx_updates_schedule   ON updates(schedule_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_node ON subscriptions(node_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status       ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_subscription ON notifications(subscription_id);
