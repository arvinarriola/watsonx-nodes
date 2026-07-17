const supabase = require('../db/supabase');

// GET /api/nodes/:id/subscription
async function getSubscription(req, res) {
  try {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('node_id', req.params.id)
      .eq('user_id', req.user.id)
      .eq('is_active', true)
      .single();
    res.json({ subscription: sub || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check subscription' });
  }
}

// POST /api/nodes/:id/subscribe
async function subscribe(req, res) {
  const { channel, channel_config = {} } = req.body;
  if (!channel || !['teams', 'slack', 'whatsapp'].includes(channel))
    return res.status(400).json({ error: 'Valid channel required: teams, slack, or whatsapp' });

  if (channel === 'whatsapp' && !channel_config.phone)
    return res.status(400).json({ error: 'WhatsApp requires a phone number' });
  if ((channel === 'slack' || channel === 'teams') && !channel_config.webhook_url)
    return res.status(400).json({ error: `${channel} requires a webhook_url` });

  try {
    const { data: node } = await supabase.from('nodes').select('id').eq('id', req.params.id).single();
    if (!node) return res.status(404).json({ error: 'Node not found' });

    // Upsert subscription
    const { data: sub, error } = await supabase
      .from('subscriptions')
      .upsert(
        { user_id: req.user.id, node_id: req.params.id, channel, channel_config, is_active: true },
        { onConflict: 'user_id,node_id' }
      )
      .select().single();
    if (error) throw error;
    res.status(201).json({ subscription: sub });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
}

// DELETE /api/nodes/:id/subscribe
async function unsubscribe(req, res) {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({ is_active: false })
      .eq('user_id', req.user.id)
      .eq('node_id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Unsubscribed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
}

module.exports = { getSubscription, subscribe, unsubscribe };
