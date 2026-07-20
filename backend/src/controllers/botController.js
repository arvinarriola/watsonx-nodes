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

const watson  = require('../services/watsonService');
const axios   = require('axios');
const twilio  = require('twilio');
const supabase = require('../db/supabase');

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
 *
 * Reaction shortcut: if the body is one of 👍 ✅ 🔥, save it as a reaction
 * against the most recent notification sent to this phone number.
 */

const REACTION_EMOJIS = new Set(['👍', '✅', '🔥']);

async function whatsappHandler(req, res) {
  const from = req.body?.From;  // e.g. "whatsapp:+63912345678"
  const body = req.body?.Body?.trim();

  if (!from || !body) {
    return res.status(400).send('<Response></Response>');
  }

  // Respond with empty TwiML immediately so Twilio doesn't retry
  res.set('Content-Type', 'text/xml').send('<Response></Response>');

  // ── Reaction shortcut ─────────────────────────────────────────────────────
  if (REACTION_EMOJIS.has(body)) {
    handleWhatsAppReaction(from, body).catch(console.error);
    return;
  }

  handleMessage({
    userId:      `whatsapp_${from}`,
    text:        body,
    channel:     'whatsapp',
    replyTarget: from,
  }).catch(console.error);
}

/**
 * Save a WhatsApp emoji reaction against the most recently sent notification
 * for this phone number, then reply with a confirmation.
 */
async function handleWhatsAppReaction(from, emoji) {
  const phone = from.replace('whatsapp:', '');

  try {
    // Find the subscription for this phone number
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, node_id')
      .eq('channel', 'whatsapp')
      .eq('is_active', true)
      .filter('channel_config->>phone', 'eq', phone)
      .single();

    if (!sub) return;

    // Find the most recent notification sent to this subscription
    const { data: notification } = await supabase
      .from('notifications')
      .select('update_id')
      .eq('subscription_id', sub.id)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    if (!notification) return;

    // Save the reaction (no user_id — external channel reaction)
    await supabase.from('reactions').insert({
      update_id: notification.update_id,
      user_id:   null,
      channel:   'whatsapp',
      emoji,
    });

    // Send a confirmation back via WhatsApp
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to:   from,
      body: `${emoji} Reaction saved!`,
    });
  } catch (err) {
    console.error('[WhatsApp reaction] Error:', err.message);
  }
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

/**
 * POST /api/bot/chat  (authenticated)
 * In-app chat widget — rule-based intent parser, no Watson console config needed.
 * Body: { message: string }
 */

// ── Simple keyword intent detector ───────────────────────────────────────────
function detectIntent(text) {
  const t = text.toLowerCase();
  if (/\b(help|what can you do|commands)\b/.test(t))                          return 'help';
  if (/\b(subscri|following|my nodes)\b/.test(t))                             return 'list_subscriptions';
  if (/\b(latest|recent|new|update|post)\b/.test(t))                          return 'latest_update';
  if (/\b(unsub|stop alert|remove sub)\b/.test(t))                            return 'unsubscribe';
  if (/\b(search|find|look(ing)? for|nodes about)\b/.test(t))                 return 'search_nodes';
  if (/\b(create|make|new node|add node)\b/.test(t))                          return 'create_node';
  return 'unknown';
}

// ── Extract a quoted or trailing phrase ───────────────────────────────────────
// e.g. "latest update on Deadlines" → "Deadlines"
//      "search for announcements"   → "announcements"
function extractTopic(text) {
  const quoted = text.match(/["']([^"']+)["']/);
  if (quoted) return quoted[1].trim();
  const patterns = [
    /(?:on|for|about|called|named|from|in)\s+(.+)$/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

async function chatHandler(req, res) {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || message.trim().length === 0)
    return res.status(400).json({ error: 'message is required' });
  if (message.length > 500)
    return res.status(400).json({ error: 'message too long (max 500 chars)' });

  const text   = message.trim();
  const intent = detectIntent(text);
  const topic  = extractTopic(text);
  const userEmail = req.user.email;

  try {
    let reply = '';

    switch (intent) {

      case 'help':
        reply =
          "Here's what I can do:\n" +
          '• "What am I subscribed to?" — list your active subscriptions\n' +
          '• "Latest update on [Node Name]" — get the most recent post\n' +
          '• "Unsubscribe from [Node Name]" — remove a subscription\n' +
          '• "Search for [keyword]" — find public nodes by topic\n' +
          '• "Create a node called [name]" — create a new node';
        break;

      case 'list_subscriptions': {
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('channel, nodes(title)')
          .eq('user_id', req.user.id)
          .eq('is_active', true);
        if (!subs?.length) {
          reply = 'You are not subscribed to any nodes yet. Go to Discover to find nodes.';
        } else {
          const list = subs.map(s => `• ${s.nodes?.title} (via ${s.channel})`).join('\n');
          reply = `Your active subscriptions:\n${list}`;
        }
        break;
      }

      case 'latest_update': {
        if (!topic) {
          reply = 'Which node would you like the latest update for? Try: "latest update on Announcements"';
          break;
        }
        const { data: update } = await supabase
          .from('updates')
          .select('content, posted_at, users!updates_author_id_fkey(name), nodes!inner(title)')
          .ilike('nodes.title', `%${topic}%`)
          .eq('status', 'open')
          .order('posted_at', { ascending: false })
          .limit(1)
          .single();
        if (!update) {
          reply = `No open updates found for "${topic}". Check the node name and try again.`;
        } else {
          const date = new Date(update.posted_at).toLocaleDateString();
          reply = `Latest update from "${update.nodes?.title}" (${date} by ${update.users?.name}):\n\n${update.content}`;
        }
        break;
      }

      case 'unsubscribe': {
        if (!topic) {
          reply = 'Which node do you want to unsubscribe from? Try: "unsubscribe from Deadlines"';
          break;
        }
        const { data: node } = await supabase
          .from('nodes').select('id, title').ilike('title', `%${topic}%`).single();
        if (!node) {
          reply = `I could not find a node matching "${topic}". Check the name and try again.`;
          break;
        }
        await supabase
          .from('subscriptions')
          .update({ is_active: false })
          .eq('user_id', req.user.id)
          .eq('node_id', node.id);
        reply = `You have been unsubscribed from "${node.title}".`;
        break;
      }

      case 'search_nodes': {
        const keyword = topic || text.replace(/search|find|look for|nodes about/gi, '').trim();
        if (!keyword) {
          reply = 'What topic would you like to search for? Try: "search for announcements"';
          break;
        }
        const { data: nodes } = await supabase
          .from('nodes')
          .select('title, description')
          .eq('is_public', true)
          .or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`)
          .order('created_at', { ascending: false })
          .limit(5);
        if (!nodes?.length) {
          reply = `No public nodes found matching "${keyword}".`;
        } else {
          const list = nodes.map(n => `• ${n.title}${n.description ? ` — ${n.description.slice(0, 60)}` : ''}`).join('\n');
          reply = `Found ${nodes.length} node${nodes.length !== 1 ? 's' : ''} matching "${keyword}":\n${list}`;
        }
        break;
      }

      case 'create_node': {
        const title = topic;
        if (!title) {
          reply = 'What would you like to name the new node? Try: "create a node called Announcements"';
          break;
        }
        const { data: newNode, error } = await supabase
          .from('nodes')
          .insert({ owner_id: req.user.id, title, is_public: true })
          .select('id, title')
          .single();
        if (error) {
          reply = `Sorry, I couldn't create the node. Please try again or use the web app.`;
        } else {
          reply = `✅ Node "${newNode.title}" created! You can now post updates to it from the web app.`;
        }
        break;
      }

      default:
        reply = "I'm not sure how to help with that. Type \"help\" to see what I can do.";
    }

    res.json({ reply, intent });
  } catch (err) {
    console.error('[Chat] Error:', err.message);
    res.status(500).json({ error: 'Failed to process your message. Please try again.' });
  }
}

module.exports = { slackHandler, whatsappHandler, testWatson, chatHandler };
