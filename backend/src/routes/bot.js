const router      = require('express').Router();
const supabase    = require('../db/supabase');
const authenticate = require('../middleware/authenticate');
const { slackHandler, whatsappHandler, testWatson, chatHandler } = require('../controllers/botController');

// ── Inbound channel webhooks ───────────────────────────────────────────────────

// POST /api/bot/slack     — Slack slash command or interactive payload
router.post('/slack', slackHandler);

// POST /api/bot/whatsapp  — Twilio WhatsApp inbound message
router.post('/whatsapp', whatsappHandler);

// ── Health / debug ─────────────────────────────────────────────────────────────

// GET /api/bot/test-watson — verify Watson credentials
router.get('/test-watson', testWatson);

// ── In-app chat (authenticated) ───────────────────────────────────────────────

// POST /api/bot/chat — browser chat widget → Watson
router.post('/chat', authenticate, chatHandler);

// ── Watson webhook (intent fulfillment) ───────────────────────────────────────
//
// Watson Assistant calls this endpoint during a conversation turn when it needs
// to fulfil an intent that requires a database lookup.
// Watson sends: { intent, user_email?, node_title? }
//
// POST /api/bot/webhook
router.post('/webhook', async (req, res) => {
  const { intent, user_email, node_title } = req.body;

  // Input validation
  if (!intent || typeof intent !== 'string' || intent.length > 50)
    return res.json({ response: "I couldn't understand that request." });
  if (user_email && (typeof user_email !== 'string' || user_email.length > 254))
    return res.json({ response: "I couldn't understand that request." });
  if (node_title && (typeof node_title !== 'string' || node_title.length > 150))
    return res.json({ response: "I couldn't understand that request." });


  try {
    switch (intent) {

      case 'list_subscriptions': {
        const { data: user } = await supabase
          .from('users').select('id').eq('email', user_email).single();
        if (!user) return res.json({ response: "I couldn't find your account." });

        const { data: subs } = await supabase
          .from('subscriptions')
          .select('channel, nodes(title)')
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (!subs?.length) return res.json({ response: 'You are not subscribed to any nodes yet.' });
        const list = subs.map(s => `• ${s.nodes?.title} (via ${s.channel})`).join('\n');
        return res.json({ response: `Your active subscriptions:\n${list}` });
      }

      case 'latest_update': {
        const { data: update } = await supabase
          .from('updates')
          .select('content, posted_at, users!updates_author_id_fkey(name), nodes!inner(title)')
          .ilike('nodes.title', node_title)
          .eq('status', 'open')
          .order('posted_at', { ascending: false })
          .limit(1)
          .single();

        if (!update) return res.json({ response: `No updates found for "${node_title}".` });
        const date = new Date(update.posted_at).toLocaleDateString();
        return res.json({
          response: `Latest update from "${node_title}" (${date} by ${update.users?.name}):\n\n${update.content}`,
        });
      }

      case 'unsubscribe': {
        if (!user_email || !node_title)
          return res.json({ response: 'Please provide your email and the node name to unsubscribe.' });

        const { data: user } = await supabase
          .from('users').select('id').eq('email', user_email).single();
        if (!user) return res.json({ response: "I couldn't find your account." });

        const { data: node } = await supabase
          .from('nodes').select('id').ilike('title', node_title).single();
        if (!node) return res.json({ response: `I couldn't find a node called "${node_title}".` });

        await supabase
          .from('subscriptions')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('node_id', node.id);

        return res.json({ response: `You have been unsubscribed from "${node_title}".` });
      }

      case 'search_nodes': {
        const keyword = (node_title || '').trim();
        if (!keyword)
          return res.json({ response: 'What topic would you like to search for?' });

        const { data: nodes } = await supabase
          .from('nodes')
          .select('id, title, description')
          .eq('is_public', true)
          .or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`)
          .order('created_at', { ascending: false })
          .limit(5);

        if (!nodes?.length)
          return res.json({ response: `No public nodes found matching "${keyword}".` });

        const list = nodes.map(n => `• ${n.title}${n.description ? ` — ${n.description.slice(0, 60)}` : ''}`).join('\n');
        return res.json({ response: `Found ${nodes.length} node${nodes.length !== 1 ? 's' : ''} matching "${keyword}":\n${list}` });
      }

      case 'create_node': {
        // Expects: { node_title, node_description?, user_email, confirm? }
        const { node_description = '', confirm } = req.body;

        if (!user_email)
          return res.json({ response: 'I need your email to create a node. What is your email?' });
        if (!node_title)
          return res.json({ response: 'What would you like to name the new node?' });

        // Confirmation step — Watson should send confirm: true after user says "yes"
        if (!confirm) {
          return res.json({
            response: `Got it! I'll create a node called "${node_title}"${node_description ? ` — "${node_description}"` : ''}. Shall I go ahead? (Say "yes" to confirm)`,
          });
        }

        const { data: user } = await supabase
          .from('users').select('id').eq('email', user_email).single();
        if (!user) return res.json({ response: "I couldn't find your account. Please check your email." });

        const { data: newNode, error } = await supabase
          .from('nodes')
          .insert({ owner_id: user.id, title: node_title, description: node_description, is_public: true })
          .select('id, title')
          .single();

        if (error) return res.json({ response: 'Sorry, I could not create the node. Please try again.' });

        return res.json({
          response: `✅ Node "${newNode.title}" created successfully! You can now post updates to it from the web app.`,
        });
      }

      case 'help':
        return res.json({
          response:
            "Here's what I can do:\n" +
            '• "What am I subscribed to?" — list your active subscriptions\n' +
            '• "Latest update on [Node Name]" — get the most recent post\n' +
            '• "Unsubscribe from [Node Name]" — remove a subscription\n' +
            '• "Search for [keyword]" — find public nodes by topic\n' +
            '• "Create a node called [name]" — create a new node\n' +
            'Visit the web app to manage settings.',
        });

      default:
        return res.json({ response: "I'm not sure how to help with that. Try saying 'help'." });
    }
  } catch (err) {
    console.error('[Bot webhook] Error:', err.message);
    res.json({ response: 'Sorry, something went wrong. Please try again.' });
  }
});

module.exports = router;
