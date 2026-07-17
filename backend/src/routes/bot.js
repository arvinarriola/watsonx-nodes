const router = require('express').Router();
const supabase = require('../db/supabase');
const { slackHandler, whatsappHandler, testWatson } = require('../controllers/botController');

// ── Inbound channel webhooks ───────────────────────────────────────────────────

// POST /api/bot/slack     — Slack slash command or interactive payload
router.post('/slack', slackHandler);

// POST /api/bot/whatsapp  — Twilio WhatsApp inbound message
router.post('/whatsapp', whatsappHandler);

// ── Health / debug ─────────────────────────────────────────────────────────────

// GET /api/bot/test-watson — verify Watson credentials
router.get('/test-watson', testWatson);

// ── Watson webhook (intent fulfillment) ───────────────────────────────────────
//
// Watson Assistant calls this endpoint during a conversation turn when it needs
// to fulfil an intent that requires a database lookup.
// Watson sends: { intent, user_email?, node_title? }
//
// POST /api/bot/webhook
router.post('/webhook', async (req, res) => {
  const { intent, user_email, node_title } = req.body;

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

      case 'help':
        return res.json({
          response:
            "Here's what I can do:\n" +
            '• "What am I subscribed to?" — list your active subscriptions\n' +
            '• "Latest update on [Node Name]" — get the most recent post\n' +
            '• "Unsubscribe from [Node Name]" — remove a subscription\n' +
            'Visit the web app to create nodes or manage settings.',
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
