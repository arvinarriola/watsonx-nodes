import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

export default function CreateNode() {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ title: '', description: '', category: '', is_public: true });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/nodes', form);
      toast.success('Node created!');
      navigate(`/nodes/${res.data.node.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create node');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Create a New Node</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
          <input type="text" required autoFocus value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Announcements, Product Releases, Deadlines" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea rows={3} value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="What kind of updates will this node publish?" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input type="text" value={form.category}
            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Engineering, HR, Product" />
        </div>
        <div className="flex items-center gap-3">
          <input id="is_public" type="checkbox" checked={form.is_public}
            onChange={e => setForm(p => ({ ...p, is_public: e.target.checked }))}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
          <label htmlFor="is_public" className="text-sm text-gray-700">
            Make this node <span className="font-medium">public</span> — anyone can discover and subscribe
          </label>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
          <p className="font-semibold mb-0.5">💡 Alert scheduling is per post</p>
          <p>Set the alert schedule for each post individually — Immediate, Specific Date &amp; Time, Specific Days, or Every X Days.</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60">
            {loading ? 'Creating...' : 'Create Node'}
          </button>
          <button type="button" onClick={() => navigate('/dashboard')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-6 py-2.5 rounded-lg transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
