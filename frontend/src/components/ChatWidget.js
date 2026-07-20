import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 14px', background: '#2a2d3a', borderRadius: '16px 16px 16px 4px', width: 'fit-content' }}>
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  );
}

// ── Format bot message — bold **text**, bullet lines ─────────────────────────
function BotMessage({ text }) {
  const lines = text.split('\n');
  return (
    <div style={{ fontSize: 13, lineHeight: 1.5, color: '#e8eaf0' }}>
      {lines.map((line, i) => {
        if (line === '') return <div key={i} style={{ height: 6 }} />;
        const parts = line.split(/\*\*(.+?)\*\*/g);
        const formatted = parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p);
        const isBullet = line.startsWith('•');
        if (isBullet) {
          return (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                background: 'rgba(79,126,248,0.06)',
                border: '1px solid rgba(79,126,248,0.12)',
                borderRadius: 8,
                padding: '8px 10px',
                marginBottom: 5,
              }}
            >
              <span style={{ color: '#4f7ef8', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>›</span>
              <span>{formatted}</span>
            </div>
          );
        }
        return (
          <div key={i} style={{ marginBottom: 4 }}>
            {formatted}
          </div>
        );
      })}
    </div>
  );
}

export default function ChatWidget() {
  const { user }                  = useAuth();
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [greeted, setGreeted]     = useState(false);
  const bottomRef                 = useRef(null);
  const inputRef                  = useRef(null);

  // Personalised greeting on first open
  useEffect(() => {
    if (!open || greeted) return;
    setGreeted(true);
    setLoading(true);
    api.get('/nodes/subscribed')
      .then(res => {
        const subs  = res.data.nodes || [];
        const name  = user?.name?.split(' ')[0] || 'there';
        const count = subs.length;
        let greeting = `Hi **${name}**! `;
        if (count === 0) {
          greeting += "You are not subscribed to any nodes yet.\n\nGo to **Discover** to find and subscribe to nodes.";
        } else {
          const titles = subs.slice(0, 3).map(n => n.title).join(', ');
          const more   = count > 3 ? ` and ${count - 3} more` : '';
          greeting += `You are subscribed to **${count}** node${count !== 1 ? 's' : ''}: ${titles}${more}.`;
        }
        greeting += '\n\nType **help** to see what I can do.';
        setMessages([{ from: 'bot', text: greeting }]);
      })
      .catch(() => {
        const name = user?.name?.split(' ')[0] || 'there';
        setMessages([{ from: 'bot', text: `Hi **${name}**! Type **help** to see what I can do.` }]);
      })
      .finally(() => setLoading(false));
  }, [open, greeted, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim().slice(0, 500);
    if (!text || loading) return;
    setMessages(prev => [...prev, { from: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/bot/chat', { message: text });
      setMessages(prev => [...prev, { from: 'bot', text: res.data.reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, { from: 'bot', text: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Open Watson Assistant"
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 50,
          width: 52, height: 52,
          background: open ? '#2a2d3a' : 'linear-gradient(135deg, #4f7ef8, #7c5cfc)',
          border: open ? '1px solid #3a3d4a' : 'none',
          borderRadius: '50%',
          boxShadow: open ? 'none' : '0 4px 24px rgba(79,126,248,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          fontSize: 20,
          color: 'white',
        }}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div
          style={{
            position: 'fixed', bottom: 88, right: 24, zIndex: 50,
            width: 340,
            maxHeight: 500,
            background: '#1a1d27',
            border: '1px solid #2a2d3a',
            borderRadius: 20,
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #4f7ef8 0%, #7c5cfc 100%)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
              🤖
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Watson Assistant</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>WatsonX Nodes</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80' }} />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>Online</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>

            {/* Loading greeting */}
            {loading && messages.length === 0 && <TypingDots />}

            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.from === 'bot' && (
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #4f7ef8, #7c5cfc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginRight: 7, alignSelf: 'flex-end' }}>
                    🤖
                  </div>
                )}
                <div style={{
                  maxWidth: '78%',
                  padding: '10px 14px',
                  borderRadius: msg.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.from === 'user'
                    ? 'linear-gradient(135deg, #4f7ef8, #7c5cfc)'
                    : '#2a2d3a',
                  color: msg.from === 'user' ? 'white' : '#e8eaf0',
                  fontSize: 13,
                  boxShadow: msg.from === 'user' ? '0 2px 12px rgba(79,126,248,0.3)' : 'none',
                }}>
                  {msg.from === 'bot' ? <BotMessage text={msg.text} /> : msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && messages.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 7 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #4f7ef8, #7c5cfc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>🤖</div>
                <TypingDots />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length <= 1 && !loading && (
            <div style={{ padding: '0 12px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { label: '🆘 Help',                  send: 'Help' },
                { label: '📋 My subscriptions',      send: 'What am I subscribed to?' },
                { label: '🔍 Search nodes',           send: 'Search for nodes' },
                { label: '📣 Latest update',          send: 'Latest update on' },
                { label: '📝 Post an update',         send: 'Post on' },
                { label: '📊 Post performance',       send: 'How did my last post perform?' },
                { label: '💡 Suggest a post',         send: 'Suggest what to post on' },
                { label: '🚫 Unsubscribe',            send: 'Unsubscribe from' },
              ].map(({ label, send }) => (
                <button
                  key={label}
                  onClick={() => { setInput(send); setTimeout(() => inputRef.current?.focus(), 50); }}
                  style={{ fontSize: 11, padding: '5px 11px', borderRadius: 99, background: 'rgba(79,126,248,0.1)', color: '#7da4fb', border: '1px solid rgba(79,126,248,0.2)', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,126,248,0.22)'; e.currentTarget.style.borderColor = 'rgba(79,126,248,0.45)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(79,126,248,0.1)'; e.currentTarget.style.borderColor = 'rgba(79,126,248,0.2)'; }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={sendMessage} style={{ padding: '10px 12px', borderTop: '1px solid #2a2d3a', display: 'flex', gap: 8, background: '#1a1d27' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask something..."
              maxLength={500}
              disabled={loading}
              style={{
                flex: 1,
                background: '#0f1117',
                border: '1px solid #2a2d3a',
                borderRadius: 10,
                padding: '9px 12px',
                fontSize: 13,
                color: '#e8eaf0',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#4f7ef8'}
              onBlur={e => e.target.style.borderColor = '#2a2d3a'}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: input.trim() && !loading ? 'linear-gradient(135deg, #4f7ef8, #7c5cfc)' : '#2a2d3a',
                color: input.trim() && !loading ? 'white' : '#7a7f9a',
                border: 'none',
                borderRadius: 10,
                padding: '9px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
