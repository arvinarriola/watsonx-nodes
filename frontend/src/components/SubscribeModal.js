import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const CHANNELS = ['slack', 'teams', 'whatsapp'];

export default function SubscribeModal({ nodeId, node, current, onClose, onSuccess }) {
  const [channel,    setChannel]    = useState(current?.channel || 'slack');
  const [webhookUrl, setWebhookUrl] = useState(current?.channel_config?.webhook_url || '');
  const [phone,      setPhone]      = useState(current?.channel_config?.phone || '');
  const [loading,    setLoading]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const channel_config = channel === 'whatsapp' ? { phone } : { webhook_url: webhookUrl };
    setLoading(true);
    try {
      const res = await api.post(`/nodes/${nodeId}/subscribe`, { channel, channel_config });
      toast.success(current ? 'Subscription updated!' : 'Subscribed successfully!');
      onSuccess(res.data.subscription);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  const FREQ_COLORS = {
    immediate: 'bg-red-100 text-red-700',
    daily:     'bg-yellow-100 text-yellow-700',
    weekly:    'bg-green-100 text-green-700',
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-1">
          {current ? 'Update Subscription' : 'Subscribe to Node'}
        </h2>
        <p className="text-sm text-gray-500 mb-4">{node?.title}</p>

        {/* Node's frequency info — read only for subscribers */}
        {node && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4 text-sm">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Alert Schedule</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${FREQ_COLORS[node.frequency] || 'bg-gray-100 text-gray-600'}`}>
                {node.frequency}
              </span>
              {node.schedule_time && node.frequency !== 'immediate' && (
                <span className="text-xs text-gray-600">at <strong>{node.schedule_time}</strong></span>
              )}
              <span className="text-xs text-gray-400 ml-1">· set by node owner</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {node.frequency === 'immediate' && 'You will be alerted instantly whenever a new update is posted.'}
              {node.frequency === 'daily'     && `You will receive a daily digest at ${node.schedule_time || '08:00'}.`}
              {node.frequency === 'weekly'    && `You will receive a weekly digest every Monday at ${node.schedule_time || '08:00'}.`}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Channel — subscriber chooses this */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Delivery Channel <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              {CHANNELS.map(c => (
                <button
                  key={c} type="button"
                  onClick={() => { setChannel(c); setWebhookUrl(''); setPhone(''); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    channel === c
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {c === 'whatsapp' ? 'WhatsApp' : c === 'teams' ? 'Teams' : 'Slack'}
                </button>
              ))}
            </div>
          </div>

          {/* Channel config */}
          {channel === 'whatsapp' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Phone Number</label>
              <input
                type="tel" required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1234567890"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1">Include country code, e.g. +63 for Philippines</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {channel === 'teams' ? 'Teams Power Automate' : 'Slack'} Webhook URL
              </label>
              <input
                type="url" required
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder={
                  channel === 'teams'
                    ? 'https://prod-xx.westus.logic.azure.com/...'
                    : 'https://hooks.slack.com/services/...'
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? 'Saving...' : current ? 'Update' : 'Subscribe'}
            </button>
            <button
              type="button" onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
