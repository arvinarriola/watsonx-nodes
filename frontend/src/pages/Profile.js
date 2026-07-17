import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Profile() {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/nodes/subscribed')
      .then(res => setSubscriptions(res.data.nodes))
      .finally(() => setLoading(false));
  }, []);

  const handleUnsubscribe = async (nodeId, nodeTitle) => {
    if (!window.confirm(`Unsubscribe from "${nodeTitle}"?`)) return;
    try {
      await api.delete(`/nodes/${nodeId}/subscribe`);
      setSubscriptions(prev => prev.filter(n => n.id !== nodeId));
      toast.success(`Unsubscribed from ${nodeTitle}`);
    } catch { toast.error('Failed to unsubscribe'); }
  };

  const CHANNEL_BADGE = { slack: 'bg-purple-100 text-purple-700', teams: 'bg-blue-100 text-blue-700', whatsapp: 'bg-green-100 text-green-700' };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Account</h2>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex gap-4"><span className="text-gray-500 w-20">Name</span><span className="font-medium">{user?.name}</span></div>
          <div className="flex gap-4"><span className="text-gray-500 w-20">Email</span><span className="font-medium">{user?.email}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Active Subscriptions <span className="text-sm font-normal text-gray-400">({subscriptions.length})</span>
        </h2>
        {loading ? <p className="text-gray-400 text-sm">Loading...</p>
          : subscriptions.length === 0 ? <p className="text-gray-400 text-sm">No active subscriptions.</p>
          : (
            <div className="flex flex-col divide-y divide-gray-100">
              {subscriptions.map(n => (
                <div key={n.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-gray-800">{n.title}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${CHANNEL_BADGE[n.channel]}`}>
                      via {n.channel}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUnsubscribe(n.id, n.title)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                  >
                    Unsubscribe
                  </button>
                </div>
              ))}
            </div>
          )}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
          <p className="font-semibold mb-1">💡 Channel Setup Reminder</p>
          <p><strong>Slack / Teams:</strong> Paste your Incoming Webhook URL when subscribing.</p>
          <p className="mt-1"><strong>WhatsApp:</strong> Enter your phone number with country code (e.g. +63xxxxxxxxxx).</p>
        </div>
      </div>
    </div>
  );
}
