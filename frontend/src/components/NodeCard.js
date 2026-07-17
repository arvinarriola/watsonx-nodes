import React from 'react';
import { Link } from 'react-router-dom';

const CHANNEL_COLORS = {
  slack:    'bg-purple-100 text-purple-700',
  teams:    'bg-blue-100 text-blue-700',
  whatsapp: 'bg-green-100 text-green-700',
};

export default function NodeCard({ node, showSubscription = false }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link to={`/nodes/${node.id}`} className="text-base font-semibold text-blue-600 hover:underline">
            {node.title}
          </Link>
          {node.category && (
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {node.category}
            </span>
          )}
        </div>
        {!node.is_public && (
          <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full shrink-0">Private</span>
        )}
      </div>

      {node.description && (
        <p className="text-sm text-gray-600 line-clamp-2">{node.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto">
        {node.owner_name && <span>by <span className="font-medium text-gray-700">{node.owner_name}</span></span>}
        <span>{node.subscriber_count || 0} subscriber{node.subscriber_count !== '1' ? 's' : ''}</span>
        <span>{node.update_count || 0} post{node.update_count !== '1' ? 's' : ''}</span>
      </div>

      {/* Subscriber's chosen channel */}
      {showSubscription && node.channel && (
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CHANNEL_COLORS[node.channel] || 'bg-gray-100 text-gray-600'}`}>
            via {node.channel}
          </span>
        </div>
      )}
    </div>
  );
}
