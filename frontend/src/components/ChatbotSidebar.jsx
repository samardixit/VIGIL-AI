import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/api';

export default function ChatbotSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{
    role: 'model',
    content: "Hi! I'm the **VIGIL-AI Assistant**, powered by Gemini.\n\nAsk me about:\n- Attendance stats\n- Active sessions\n- How face scanning works",
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const feedRef = useRef(null);

  const quickQuestions = [
    'What is my attendance?',
    'Is there an active class?',
    'How does face scan work?',
  ];

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const history = messages
        .filter((m, i) => !(i === 0 && m.role === 'model'))
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));
      const res = await sendChatMessage(msg, history.slice(-10));
      setMessages((prev) => [...prev, { role: 'model', content: res.data.response }]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'model',
        content: "Couldn't connect right now. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const renderContent = (text) =>
    text.split('\n').map((line, i) => {
      let html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      const bullet = html.startsWith('- ');
      if (bullet) html = '• ' + html.slice(2);
      return (
        <div key={i} style={{ paddingLeft: bullet ? 8 : 0, marginBottom: 2 }}
          dangerouslySetInnerHTML={{ __html: html }} />
      );
    });

  return (
    <>
      {/* FAB */}
      <button
        id="chatbot-fab"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center border transition-all"
        style={{
          background: isOpen ? 'rgba(255,255,255,0.06)' : '#3B82F6',
          borderColor: isOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
          boxShadow: isOpen ? 'none' : '0 4px 16px rgba(59,130,246,0.35)',
          transform: isOpen ? 'scale(0.95)' : 'scale(1)',
        }}
      >
        {isOpen
          ? <CloseIcon />
          : <BotIcon className="text-white" />}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[360px] max-h-[560px] flex flex-col rounded-2xl animate-scale-in overflow-hidden"
          style={{
            background: '#0F172A',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <BotIcon className="text-blue-400" size={15} />
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-200">VIGIL Assistant</div>
                <div className="text-xs text-gray-600">Powered by Gemini</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] transition-colors">
              <CloseIcon size={14} />
            </button>
          </div>

          {/* Messages */}
          <div ref={feedRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ maxHeight: 320 }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[88%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'self-end bg-blue-500 text-white ml-8'
                    : 'self-start bg-white/[0.05] border border-white/[0.06] text-gray-300 mr-8'
                }`}
              >
                {renderContent(msg.content)}
              </div>
            ))}
            {loading && (
              <div className="self-start bg-white/[0.05] border border-white/[0.06] rounded-xl px-3.5 py-3">
                <div className="flex gap-1 items-center">
                  {[0, 150, 300].map((d) => (
                    <div key={d} className="w-1.5 h-1.5 rounded-full bg-gray-500"
                      style={{ animation: `pulse 1s ease-in-out ${d}ms infinite` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick questions */}
          <div className="flex gap-1.5 px-4 py-2 border-t border-white/[0.04] overflow-x-auto">
            {quickQuestions.map((q, i) => (
              <button key={i} onClick={() => handleSend(q)}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.06] text-gray-400 hover:text-gray-200 hover:bg-white/[0.07] transition-colors whitespace-nowrap">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 px-3 py-3 border-t border-white/[0.06]">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything..."
              disabled={loading}
              className="flex-1 px-3 py-2 text-xs rounded-lg outline-none font-[inherit] transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#E5E7EB',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center disabled:opacity-40 transition-opacity hover:bg-blue-400"
            >
              <SendIcon className="text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Icons ─────────────────────────────────────────── */
function BotIcon({ className = '', size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M12 11V3" /><circle cx="12" cy="3" r="1" />
      <path d="M8 15h.01M12 15h.01M16 15h.01" />
    </svg>
  );
}
function CloseIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function SendIcon({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
