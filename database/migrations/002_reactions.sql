-- WatsonX Nodes — v1.5 Migration
-- Adds the reactions table for post reactions from web, WhatsApp, and Slack

CREATE TABLE IF NOT EXISTS reactions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  update_id  UUID NOT NULL REFERENCES updates(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL for external channel reactions
  channel    VARCHAR(20) NOT NULL CHECK (channel IN ('web', 'whatsapp', 'slack')),
  emoji      VARCHAR(10) NOT NULL CHECK (emoji IN ('👍', '✅', '🔥')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (update_id, user_id, emoji)  -- one emoji per user per post (web only; channel reactions allow dupes via NULL user_id)
);

CREATE INDEX IF NOT EXISTS idx_reactions_update ON reactions(update_id);
