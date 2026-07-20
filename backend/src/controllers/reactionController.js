const supabase = require('../db/supabase');

const VALID_EMOJIS = ['👍', '✅', '🔥'];

// POST /api/updates/:id/react
async function reactToUpdate(req, res) {
  const { emoji } = req.body;
  if (!VALID_EMOJIS.includes(emoji))
    return res.status(400).json({ error: 'Invalid emoji. Use 👍, ✅, or 🔥' });

  try {
    const { data: update } = await supabase
      .from('updates').select('id').eq('id', req.params.id).single();
    if (!update) return res.status(404).json({ error: 'Post not found' });

    // Toggle: if the same user already reacted with this emoji, remove it
    const { data: existing } = await supabase
      .from('reactions')
      .select('id')
      .eq('update_id', req.params.id)
      .eq('user_id', req.user.id)
      .eq('emoji', emoji)
      .single();

    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id);
    } else {
      await supabase.from('reactions').insert({
        update_id: req.params.id,
        user_id:   req.user.id,
        channel:   'web',
        emoji,
      });
    }

    // Return updated counts for this post
    const counts = await getReactionCounts(req.params.id);
    res.json({ reactions: counts, toggled: !existing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save reaction' });
  }
}

// GET counts helper — used by reactionController and updateController
async function getReactionCounts(updateId) {
  const { data } = await supabase
    .from('reactions')
    .select('emoji')
    .eq('update_id', updateId);

  const counts = { '👍': 0, '✅': 0, '🔥': 0 };
  (data || []).forEach(r => { if (counts[r.emoji] !== undefined) counts[r.emoji]++; });
  return counts;
}

module.exports = { reactToUpdate, getReactionCounts };
