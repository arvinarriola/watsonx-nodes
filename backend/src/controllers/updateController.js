const supabase = require('../db/supabase');
const { dispatchImmediate } = require('../services/notificationService');
const { getReactionCounts } = require('./reactionController');

// GET /api/nodes/:id/updates
async function listUpdates(req, res) {
  try {
    const { data: node } = await supabase.from('nodes').select('id, owner_id, is_public').eq('id', req.params.id).single();
    if (!node) return res.status(404).json({ error: 'Node not found' });

    const { data: updates, error } = await supabase
      .from('updates')
      .select(`*, users!updates_author_id_fkey(name)`)
      .eq('node_id', req.params.id)
      .order('posted_at', { ascending: false });
    if (error) throw error;

    const enriched = await Promise.all(updates.map(async (u) => {
      const reactions = await getReactionCounts(u.id);

      // Delivery counts from notifications table
      const { count: sentCount } = await supabase
        .from('notifications').select('*', { count: 'exact', head: true })
        .eq('update_id', u.id).eq('status', 'sent');
      const { count: failedCount } = await supabase
        .from('notifications').select('*', { count: 'exact', head: true })
        .eq('update_id', u.id).eq('status', 'failed');

      return {
        ...u,
        author_name: u.users?.name,
        reactions,
        delivery: { sent: sentCount || 0, failed: failedCount || 0 },
      };
    }));
    res.json({ updates: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch updates' });
  }
}

// POST /api/nodes/:id/updates
async function createUpdate(req, res) {
  const { content, schedule_type = 'immediate', schedule_config = {} } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  try {
    const { data: node } = await supabase.from('nodes').select('id, owner_id, title').eq('id', req.params.id).single();
    if (!node) return res.status(404).json({ error: 'Node not found' });
    if (node.owner_id !== req.user.id) return res.status(403).json({ error: 'Only the node owner can post updates' });

    const { data: update, error } = await supabase
      .from('updates')
      .insert({ node_id: req.params.id, author_id: req.user.id, content, schedule_type, schedule_config, status: 'open' })
      .select().single();
    if (error) throw error;

    // Dispatch immediate notifications asynchronously
    if (schedule_type === 'immediate') {
      dispatchImmediate(req.params.id, update, node.title).catch(console.error);
    }

    res.status(201).json({ update });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post update' });
  }
}

// PUT /api/updates/:id
async function editUpdate(req, res) {
  const { content, schedule_type, schedule_config } = req.body;
  try {
    const { data: existing } = await supabase
      .from('updates').select('*, nodes(owner_id)').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ error: 'Post not found' });
    if (existing.nodes.owner_id !== req.user.id) return res.status(403).json({ error: 'Not the owner' });
    if (existing.status === 'closed') return res.status(400).json({ error: 'Cannot edit a closed post' });

    const { data: update, error } = await supabase
      .from('updates')
      .update({ content, schedule_type, schedule_config, updated_at: new Date() })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json({ update });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to edit post' });
  }
}

// PATCH /api/updates/:id/close
async function closeUpdate(req, res) {
  try {
    const { data: existing } = await supabase
      .from('updates').select('*, nodes(owner_id)').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ error: 'Post not found' });
    if (existing.nodes.owner_id !== req.user.id) return res.status(403).json({ error: 'Not the owner' });

    const { data: update, error } = await supabase
      .from('updates').update({ status: 'closed' }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ update });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to close post' });
  }
}

// PATCH /api/updates/:id/reopen
async function reopenUpdate(req, res) {
  try {
    const { data: existing } = await supabase
      .from('updates').select('*, nodes(owner_id)').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ error: 'Post not found' });
    if (existing.nodes.owner_id !== req.user.id) return res.status(403).json({ error: 'Not the owner' });

    const { data: update, error } = await supabase
      .from('updates').update({ status: 'open' }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ update });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reopen post' });
  }
}

module.exports = { listUpdates, createUpdate, editUpdate, closeUpdate, reopenUpdate };
