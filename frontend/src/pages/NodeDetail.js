import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ChannelSetupModal from '../components/ChannelSetupModal';
import ScheduleSelector, { scheduleLabel, SCHEDULE_BADGE } from '../components/ScheduleSelector';

// ─── Inline edit modal ────────────────────────────────────────────────────────
function EditPostModal({ update, onClose, onSave }) {
  const [content, setContent]   = useState(update.content);
  const [schedule, setSchedule] = useState({
    schedule_type:   update.schedule_type,
    schedule_config: update.schedule_config,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(update.id, { content, ...schedule });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <h2 className="text-base font-bold text-gray-800 mb-4">Edit Post</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
            <textarea
              rows={4} required
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Alert Schedule</label>
            <ScheduleSelector value={schedule} onChange={setSchedule} />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit" disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button" onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reaction bar ─────────────────────────────────────────────────────────────
const EMOJIS = ['👍', '✅', '🔥'];

function ReactionBar({ updateId, initialReactions }) {
  const [reactions, setReactions] = useState(initialReactions || { '👍': 0, '✅': 0, '🔥': 0 });
  const [busy, setBusy] = useState(false);

  const handleReact = async (emoji) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.post(`/updates/${updateId}/react`, { emoji });
      setReactions(res.data.reactions);
    } catch {
      toast.error('Failed to save reaction');
    } finally {
      setBusy(false);
    }
  };

  const total = Object.values(reactions).reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-1">
      {EMOJIS.map(emoji => (
        <button
          key={emoji}
          onClick={() => handleReact(emoji)}
          disabled={busy}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <span>{emoji}</span>
          {reactions[emoji] > 0 && (
            <span className="font-semibold text-gray-600">{reactions[emoji]}</span>
          )}
        </button>
      ))}
      {total > 0 && (
        <span className="text-xs text-gray-400 ml-1">{total} reaction{total !== 1 ? 's' : ''}</span>
      )}
    </div>
  );
}

// ─── Single update card ───────────────────────────────────────────────────────
function UpdateCard({ update, isOwner, onEdit, onClose, onReopen }) {
  const isClosed = update.status === 'closed';

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 transition-opacity ${
      isClosed ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-white border-gray-200'
    }`}>
      {/* Status + schedule badge row */}
      <div className="flex items-center gap-2 flex-wrap">
        {isClosed ? (
          <span className="text-xs font-semibold bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Closed</span>
        ) : (
          <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Open</span>
        )}
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${SCHEDULE_BADGE[update.schedule_type] || 'bg-gray-100 text-gray-500'}`}>
          {scheduleLabel(update)}
        </span>
      </div>

      {/* Content */}
      <p className={`text-sm whitespace-pre-wrap ${isClosed ? 'text-gray-500 line-through decoration-gray-400' : 'text-gray-800'}`}>
        {update.content}
      </p>

      {/* Meta + actions */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <p className="text-xs text-gray-400">
          {update.author_name} · {new Date(update.posted_at).toLocaleString()}
        </p>
        {isOwner && (
          <div className="flex gap-2 shrink-0">
            {!isClosed && (
              <button
                onClick={() => onEdit(update)}
                className="text-xs text-blue-500 hover:text-blue-700 font-medium border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Edit
              </button>
            )}
            {isClosed ? (
              <button
                onClick={() => onReopen(update.id)}
                className="text-xs text-green-600 hover:text-green-800 font-medium border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-50 transition-colors"
              >
                Reopen
              </button>
            ) : (
              <button
                onClick={() => onClose(update.id)}
                className="text-xs text-gray-500 hover:text-red-600 font-medium border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>

      {/* Reactions */}
      <ReactionBar updateId={update.id} initialReactions={update.reactions} />
    </div>
  );
}

// ─── Main NodeDetail page ─────────────────────────────────────────────────────
export default function NodeDetail() {
  const { id }   = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [node, setNode]                   = useState(null);
  const [updates, setUpdates]             = useState([]);
  const [subscription, setSubscription]   = useState(null);
  const [loading, setLoading]             = useState(true);

  // post form
  const [content, setContent]   = useState('');
  const [schedule, setSchedule] = useState({ schedule_type: 'immediate', schedule_config: {} });
  const [posting, setPosting]   = useState(false);

  // modals
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [editTarget, setEditTarget]       = useState(null);

  // filter
  const [filter, setFilter] = useState('all'); // all | open | closed

  const isOwner = node?.owner_id === user?.id;

  useEffect(() => {
    Promise.all([
      api.get(`/nodes/${id}`),
      api.get(`/nodes/${id}/updates`),
      api.get(`/nodes/${id}/subscription`),
    ])
      .then(([nodeRes, updatesRes, subRes]) => {
        setNode(nodeRes.data.node);
        setUpdates(updatesRes.data.updates);
        setSubscription(subRes.data.subscription);
      })
      .catch(() => { toast.error('Node not found'); navigate('/dashboard'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (schedule.schedule_type === 'specific_days' && !(schedule.schedule_config.days?.length))
      return toast.error('Select at least one day for the alert.');
    setPosting(true);
    try {
      const res = await api.post(`/nodes/${id}/updates`, { content, ...schedule });
      setUpdates(prev => [res.data.update, ...prev]);
      setContent('');
      setSchedule({ schedule_type: 'immediate', schedule_config: {} });
      toast.success('Post published!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleEdit = async (updateId, payload) => {
    try {
      const res = await api.put(`/updates/${updateId}`, payload);
      setUpdates(prev => prev.map(u => u.id === updateId ? res.data.update : u));
      toast.success('Post updated');
    } catch {
      toast.error('Failed to update post');
    }
  };

  const handleClose = async (updateId) => {
    if (!window.confirm('Close this post? Subscribers will no longer receive alerts for it.')) return;
    try {
      const res = await api.patch(`/updates/${updateId}/close`);
      setUpdates(prev => prev.map(u => u.id === updateId ? res.data.update : u));
      toast.success('Post closed');
    } catch {
      toast.error('Failed to close post');
    }
  };

  const handleReopen = async (updateId) => {
    try {
      const res = await api.patch(`/updates/${updateId}/reopen`);
      setUpdates(prev => prev.map(u => u.id === updateId ? res.data.update : u));
      toast.success('Post reopened');
    } catch {
      toast.error('Failed to reopen post');
    }
  };

  const handleUnsubscribe = async () => {
    if (!window.confirm('Unsubscribe from this node?')) return;
    try {
      await api.delete(`/nodes/${id}/subscribe`);
      setSubscription(null);
      toast.success('Unsubscribed');
    } catch {
      toast.error('Failed to unsubscribe');
    }
  };

  const handleDeleteNode = async () => {
    if (!window.confirm('Delete this node? This cannot be undone.')) return;
    try {
      await api.delete(`/nodes/${id}`);
      toast.success('Node deleted');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete node');
    }
  };

  const visibleUpdates = updates.filter(u =>
    filter === 'all' ? true : u.status === filter
  );

  if (loading) return <div className="flex justify-center mt-20 text-gray-400">Loading...</div>;
  if (!node) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* ── Node Header ── */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-800">{node.title}</h1>
            {node.category && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{node.category}</span>
            )}
            {!node.is_public && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Private</span>
            )}
          </div>
          {node.description && <p className="text-gray-500 text-sm">{node.description}</p>}
          <p className="text-xs text-gray-400 mt-1">
            by {node.owner_name} · {node.subscriber_count} subscriber{node.subscriber_count !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {isOwner ? (
            <button onClick={handleDeleteNode} className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors">
              Delete Node
            </button>
          ) : subscription ? (
            <button onClick={handleUnsubscribe} className="text-sm text-gray-600 hover:text-red-600 font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 transition-colors">
              Unsubscribe
            </button>
          ) : (
            <button onClick={() => setShowSubscribe(true)} className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded-lg transition-colors">
              Subscribe
            </button>
          )}
        </div>
      </div>

      {/* ── Subscription badge ── */}
      {subscription && (
        <div className="mb-5 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
          <span>✅ Subscribed via <strong>{subscription.channel}</strong></span>
          <button onClick={() => setShowSubscribe(true)} className="ml-auto text-xs text-blue-500 hover:underline">Change</button>
        </div>
      )}

      {/* ── Post New Update (owner only) ── */}
      {isOwner && (
        <form onSubmit={handlePost} className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Post a New Update</h3>
          <textarea
            rows={3}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your update here..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
          />

          {/* Alert Schedule */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Alert Schedule</p>
            <ScheduleSelector value={schedule} onChange={setSchedule} />
          </div>

          <button
            type="submit" disabled={posting || !content.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-60"
          >
            {posting ? 'Posting...' : 'Post Update'}
          </button>
        </form>
      )}

      {/* ── Posts List ── */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <h3 className="text-base font-semibold text-gray-700">
          Posts <span className="text-gray-400 font-normal text-sm">({updates.length})</span>
        </h3>
        {/* Filter tabs */}
        <div className="flex gap-1">
          {['all', 'open', 'closed'].map(f => (
            <button
              key={f} onClick={() => setFilter(f)}
              className={`text-xs font-semibold px-3 py-1 rounded-full border transition-colors capitalize ${
                filter === f
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {visibleUpdates.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400">
          {filter === 'all' ? 'No posts yet.' : `No ${filter} posts.`}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleUpdates.map(u => (
            <UpdateCard
              key={u.id}
              update={u}
              isOwner={isOwner}
              onEdit={setEditTarget}
              onClose={handleClose}
              onReopen={handleReopen}
            />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {showSubscribe && (
        <ChannelSetupModal
          nodeId={id}
          node={node}
          current={subscription}
          onClose={() => setShowSubscribe(false)}
          onSuccess={(sub) => { setSubscription(sub); setShowSubscribe(false); }}
        />
      )}

      {editTarget && (
        <EditPostModal
          update={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  );
}
