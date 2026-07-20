const supabase = require('../db/supabase');

// GET /api/nodes
async function listNodes(req, res) {
  try {
    const { data: nodes, error } = await supabase
      .from('nodes')
      .select(`*, users!nodes_owner_id_fkey(name)`)
      .or(`is_public.eq.true,owner_id.eq.${req.user.id}`)
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Attach counts
    const enriched = await Promise.all(nodes.map(async (n) => {
      const { count: sub_count } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('node_id', n.id).eq('is_active', true);
      const { count: upd_count } = await supabase.from('updates').select('*', { count: 'exact', head: true }).eq('node_id', n.id);
      return { ...n, owner_name: n.users?.name, subscriber_count: sub_count || 0, update_count: upd_count || 0 };
    }));
    res.json({ nodes: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch nodes' });
  }
}

// GET /api/nodes/mine
async function myNodes(req, res) {
  try {
    const { data: nodes, error } = await supabase
      .from('nodes').select('*')
      .eq('owner_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const enriched = await Promise.all(nodes.map(async (n) => {
      const { count: sub_count } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('node_id', n.id).eq('is_active', true);
      const { count: upd_count } = await supabase.from('updates').select('*', { count: 'exact', head: true }).eq('node_id', n.id);
      return { ...n, subscriber_count: sub_count || 0, update_count: upd_count || 0 };
    }));
    res.json({ nodes: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch your nodes' });
  }
}

// GET /api/nodes/subscribed
async function subscribedNodes(req, res) {
  try {
    const { data: subs, error } = await supabase
      .from('subscriptions')
      .select(`*, nodes(*, users!nodes_owner_id_fkey(name))`)
      .eq('user_id', req.user.id)
      .eq('is_active', true);
    if (error) throw error;

    const nodes = await Promise.all(subs.map(async (s) => {
      const { count: sub_count } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('node_id', s.nodes.id).eq('is_active', true);
      const { count: upd_count } = await supabase.from('updates').select('*', { count: 'exact', head: true }).eq('node_id', s.nodes.id);
      return {
        ...s.nodes,
        owner_name: s.nodes?.users?.name,
        channel: s.channel,
        channel_config: s.channel_config,
        subscriber_count: sub_count || 0,
        update_count: upd_count || 0,
      };
    }));
    res.json({ nodes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subscribed nodes' });
  }
}

// GET /api/nodes/:id
async function getNode(req, res) {
  try {
    const { data: node, error } = await supabase
      .from('nodes')
      .select(`*, users!nodes_owner_id_fkey(name)`)
      .eq('id', req.params.id)
      .single();
    if (error || !node) return res.status(404).json({ error: 'Node not found' });
    if (!node.is_public && node.owner_id !== req.user.id)
      return res.status(403).json({ error: 'Access denied' });

    const { count } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('node_id', node.id).eq('is_active', true);
    res.json({ node: { ...node, owner_name: node.users?.name, subscriber_count: count || 0 } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch node' });
  }
}

// POST /api/nodes
async function createNode(req, res) {
  const { title, description, category, is_public = true } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  try {
    const { data: node, error } = await supabase
      .from('nodes')
      .insert({ owner_id: req.user.id, title, description, category, is_public })
      .select().single();
    if (error) throw error;
    res.status(201).json({ node });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create node' });
  }
}

// PUT /api/nodes/:id
async function updateNode(req, res) {
  const { title, description, category, is_public } = req.body;
  try {
    const { data: existing } = await supabase.from('nodes').select('owner_id').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ error: 'Node not found' });
    if (existing.owner_id !== req.user.id) return res.status(403).json({ error: 'Not the owner' });

    const { data: node, error } = await supabase
      .from('nodes')
      .update({ title, description, category, is_public, updated_at: new Date() })
      .eq('id', req.params.id)
      .select().single();
    if (error) throw error;
    res.json({ node });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update node' });
  }
}

// DELETE /api/nodes/:id
async function deleteNode(req, res) {
  try {
    const { data: existing } = await supabase.from('nodes').select('owner_id').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ error: 'Node not found' });
    if (existing.owner_id !== req.user.id) return res.status(403).json({ error: 'Not the owner' });

    const { error } = await supabase.from('nodes').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Node deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete node' });
  }
}

module.exports = { listNodes, myNodes, subscribedNodes, getNode, createNode, updateNode, deleteNode };
