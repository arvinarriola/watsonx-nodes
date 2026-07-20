import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatWidget() {
  const { user }                  = useAuth();
  const [open, setOpen]           = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [greeted, setGreeted]     = useState(false);
  const bottomRef                 = useRef(null);

  // Build personalised greeting when widget opens for the first time
  useEffect(() => {
    if (!open || greeted) return;
    setGreeted(true);
    setLoading(true);
    api.get('/nodes/subscribed')
      .then(res => {
        const subs  = res.data.nodes || [];
        const name  = user?.name?.split(' ')[0] || 'there';
        const count = subs.length;
        let greeting = `Hi ${name}! `;
        if (count === 0) {
          greeting += "You are not subscribed to any nodes yet. Go to Discover to find nodes.\n\n";
        } else {
          const titles = subs.slice(0, 3).map(n => n.title).join(', ');
          const more   = count > 3 ? ` and ${count - 3} more` : '';
          greeting += `You are subscribed to ${count} node${count !== 1 ? 's' : ''}: ${titles}${more}.\n\n`;
        }
        greeting += 'Type "help" to see what I can do.';
        setMessages([{ from: 'bot', text: greeting }]);
      })
      .catch(() => {
        const name = user?.name?.split(' ')[0] || 'there';
        setMessages([{ from: 'bot', text: `Hi ${name}! Type "help" to see what I can do.` }]);
      })
      .finally(() => setLoading(false));
  }, [open, greeted, user]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

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
        aria-label="Open Watson Assistant chat"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors text-2xl"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
             style={{ maxHeight: '460px' }}>

          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 flex items-center gap-2">
            <span className="text-white font-semibold text-sm">Watson Assistant</span>
            <span className="ml-auto text-xs text-blue-200">WatsonX Nodes</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2" style={{ minHeight: 0 }}>
            {loading && messages.length === 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-400 text-sm px-3 py-2 rounded-2xl rounded-bl-sm">
                  Loading...
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.from === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && messages.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-400 text-sm px-3 py-2 rounded-2xl rounded-bl-sm">
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="border-t border-gray-200 p-2 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask something..."
              maxLength={500}
              disabled={loading}
              className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
