import React from 'react';
import { Link } from 'react-router-dom';

const CHANNEL_COLORS = {
  slack:    { bg: 'rgba(124,92,252,0.12)', color: '#a78bfa', border: 'rgba(124,92,252,0.25)' },
  teams:    { bg: 'rgba(79,126,248,0.12)', color: '#7da4fb', border: 'rgba(79,126,248,0.25)' },
  whatsapp: { bg: 'rgba(52,211,153,0.12)', color: '#34d399', border: 'rgba(52,211,153,0.25)' },
};

export default function NodeCard({ node, showSubscription = false }) {
  const ch = CHANNEL_COLORS[node.channel] || { bg: 'rgba(122,127,154,0.12)', color: '#7a7f9a', border: 'rgba(122,127,154,0.25)' };

  return (
    <div
      style={{
        background: '#1a1d27',
        border: '1px solid #2a2d3a',
        borderRadius: 16,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = '#4f7ef8';
        e.currentTarget.style.boxShadow = '0 0 24px rgba(79,126,248,0.1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#2a2d3a';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <Link
            to={`/nodes/${node.id}`}
            style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = '#4f7ef8'}
            onMouseLeave={e => e.target.style.color = '#e8eaf0'}
          >
            {node.title}
          </Link>
          {node.category && (
            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, background: 'rgba(79,126,248,0.12)', color: '#7da4fb', border: '1px solid rgba(79,126,248,0.2)', padding: '1px 8px', borderRadius: 99 }}>
              {node.category}
            </span>
          )}
        </div>
        {!node.is_public && (
          <span style={{ fontSize: 11, fontWeight: 600, background: 'rgba(245,158,11,0.12)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)', padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap' }}>
            Private
          </span>
        )}
      </div>

      {/* Description */}
      {node.description && (
        <p style={{ fontSize: 13, color: '#7a7f9a', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {node.description}
        </p>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'auto' }}>
        {node.owner_name && (
          <span style={{ fontSize: 12, color: '#7a7f9a' }}>
            by <span style={{ color: '#a0a4ba', fontWeight: 500 }}>{node.owner_name}</span>
          </span>
        )}
        <span style={{ fontSize: 12, color: '#7a7f9a' }}>{node.subscriber_count || 0} subs</span>
        <span style={{ fontSize: 12, color: '#7a7f9a' }}>{node.update_count || 0} posts</span>
      </div>

      {/* Channel badge */}
      {showSubscription && node.channel && (
        <div style={{ paddingTop: 10, borderTop: '1px solid #2a2d3a' }}>
          <span style={{ fontSize: 11, fontWeight: 600, background: ch.bg, color: ch.color, border: `1px solid ${ch.border}`, padding: '3px 10px', borderRadius: 99 }}>
            via {node.channel}
          </span>
        </div>
      )}
    </div>
  );
}
