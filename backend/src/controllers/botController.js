/**
 * botController.js
 *
 * Handles inbound messages from external channels (Slack Events API,
 * Twilio WhatsApp webhooks) and routes them through Watson Assistant.
 *
 * Flow:
 *   1. Channel adapter parses the inbound payload into a canonical { userId, text, channel, replyTo } object
 *   2. A Watson session is looked up or created for that userId
 *   3. The message is sent to Watson; the reply text is returned
 *   4. If Watson detects an intent that needs a DB lookup, /api/bot/webhook handles it via Watson's
 *      "webhook" callout feature — so this controller just sends the reply text back to the channel
 *   5. Reply is dispatched back to the user via the appropriate channel sender
 */

const watson = require('../services/watsonService');
const axios  = require('axios');
const twilio = require('twilio');

// ── In-memory session store (keyed by userId string) ─────────────────────────
// For production, swap with Redis or a Supabase table.
const sessions = new Map(); // userId → { sessionId, lastActive }
const SESSION_TTL_MS = 4 * 60 * 1000; // 4 min — Watson expires at 5 min

async function getOrCreateSession(userId) {
  const existing = sessions.get(userId);
  if (existing && Date.now() - existing.lastActive < SESSION_TTL_MS) {
    existing.lastActive = Date.now();
    return existing.sessionId;
  }
  // Create a fresh Watson session
  const sessionId = await watson.createSession();
  sessions.set(userId, { sessionId, lastActive: Date.now() });
  return sessionId;
}

// ── Channel reply senders ─────────────────────────────────────────────────────

async function replyToSlack(responseUrl, text) {
  await axios.post(responseUrl, { text, response_type: 'in_channel' });
}

async function replyToWhatsApp(to, text) {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to,
    body: text,
  });
}

// ── Core message handler ──────────────────────────────────────────────────────

async function handleMessage({ userId, text, channel, replyTarget }) {
  try {
    const sessionId = await getOrCreateSession(userId);
    const { text: reply } = await watson.sendMessage(sessionId, text, userId);

    if (channel === 'slack') {
      await replyToSlack(replyTarget, reply);
    } else if (channel === 'whatsapp') {
      await replyToWhatsApp(replyTarget, reply);
    }
  } catch (err) {
    console.error(`[BotController] Error handling message for ${userId}:`, err.message);
    // Best-effort error reply
    try {
      const errMsg = 'Sorry, something went wrong. Please try again.';
      if (channel === 'slack') await replyToSlack(replyTarget, errMsg);
      if (channel === 'whatsapp') await replyToWhatsApp(replyTarget, errMsg);
    } catch (_) { /* swallow */ }
  }
}

// ── Route handlers ────────────────────────────────────────────────────────────

/**
 * POST /api/bot/slack
 * Handles Slack slash commands or interactive payloads.
 * Slack sends: { user_id, text, response_url }
 */
async function slackHandler(req, res) {
  const { user_id, text, response_url } = req.body;
  if (!user_id || !text || !response_url) {
    return res.status(400).json({ error: 'Missing user_id, text, or response_url' });
  }

  // Acknowledge immediately (Slack requires <3s response)
  res.json({ text: '⏳ Thinking...' });

  // Process asynchronously
  handleMessage({
    userId:      `slack_${user_id}`,
    text:        text.trim(),
    channel:     'slack',
    replyTarget: response_url,
  }).catch(console.error);
}

/**
 * POST /api/bot/whatsapp
 * Handles Twilio WhatsApp inbound webhook.
 * Twilio sends form-encoded: { From, Body, ... }
 */
async function whatsappHandler(req, res) {
  const from = req.body?.From;  // e.g. "whatsapp:+63912345678"
  const body = req.body?.Body;

  if (!from || !body) {
    return res.status(400).send('<Response></Response>');
  }

  // Respond with empty TwiML immediately so Twilio doesn't retry
  res.set('Content-Type', 'text/xml').send('<Response></Response>');

  handleMessage({
    userId:      `whatsapp_${from}`,
    text:        body.trim(),
    channel:     'whatsapp',
    replyTarget: from,           // send reply back to the sender's WhatsApp number
  }).catch(console.error);
}

/**
 * GET /api/bot/test-watson
 * Verifies Watson credentials. Safe to call at startup.
 */
async function testWatson(req, res) {
  try {
    await watson.testConnection();
    res.json({ status: 'ok', message: 'Watson Assistant connected successfully.' });
  } catch (err) {
    console.error('[Watson test] Failed:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
}

module.exports = { slackHandler, whatsappHandler, testWatson };
