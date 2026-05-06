import { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ChatbotSidebar() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content:
        "Hi! I'm **VIGIL-AI Assistant** 🤖\n\nI can help you with:\n- 📊 Attendance statistics\n- 📍 Session information\n- ❓ System questions\n\nWhat would you like to know?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const feedRef = useRef(null);

  const quickQuestions = [
    'What is my attendance?',
    'Is there an active class?',
    'How does face scan work?',
  ];

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages.map((m) => ({
        role: m.role === 'model' ? 'model' : 'user',
        content: m.content,
      }));
      const res = await sendChatMessage(msg, history.slice(-10));
      setMessages((prev) => [
        ...prev,
        { role: 'model', content: res.data.response },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: "Sorry, I couldn't connect right now. Please try again! 🔧",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render markdown-lite (bold and bullet points)
  const renderContent = (text) => {
    return text.split('\n').map((line, i) => {
      let rendered = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      const isBullet = rendered.startsWith('- ');
      if (isBullet) rendered = '• ' + rendered.slice(2);
      return (
        <div
          key={i}
          style={{ marginBottom: '2px', paddingLeft: isBullet ? '8px' : 0 }}
          dangerouslySetInnerHTML={{ __html: rendered }}
        />
      );
    });
  };

  return (
    <>
      {/* FAB (Floating Action Button) */}
      <button
        id="chatbot-fab"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...styles.fab,
          transform: isOpen ? 'scale(0.9) rotate(45deg)' : 'scale(1)',
        }}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Sidebar Panel */}
      {isOpen && (
        <div className="animate-slide-right" style={styles.sidebar}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerInfo}>
              <div style={styles.botAvatar}>🤖</div>
              <div>
                <div style={styles.headerTitle}>VIGIL-AI Assistant</div>
                <div style={styles.headerSub}>Powered by Gemini</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div ref={feedRef} style={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.msgBubble,
                  ...(msg.role === 'user' ? styles.userBubble : styles.botBubble),
                }}
              >
                {renderContent(msg.content)}
              </div>
            ))}
            {loading && (
              <div style={styles.botBubble}>
                <div style={styles.typing}>
                  <span style={styles.dot} />
                  <span style={{ ...styles.dot, animationDelay: '0.15s' }} />
                  <span style={{ ...styles.dot, animationDelay: '0.3s' }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick questions */}
          <div style={styles.quickRow}>
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                style={styles.quickBtn}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={styles.inputRow}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              style={styles.input}
              disabled={loading}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                ...styles.sendBtn,
                opacity: loading || !input.trim() ? 0.4 : 1,
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  fab: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,212,255,0.3)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebar: {
    position: 'fixed',
    bottom: '90px',
    right: '24px',
    width: '380px',
    maxHeight: '600px',
    background: 'rgba(10, 14, 39, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
    zIndex: 999,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.1))',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  headerInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  botAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(0,212,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.2rem',
  },
  headerTitle: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#f0f4ff',
  },
  headerSub: {
    fontSize: '0.65rem',
    color: '#8b95b3',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#8b95b3',
    fontSize: '1.1rem',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '350px',
  },
  msgBubble: {
    maxWidth: '85%',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '0.8rem',
    lineHeight: 1.5,
    wordWrap: 'break-word',
  },
  userBubble: {
    alignSelf: 'flex-end',
    background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
    color: 'white',
    borderBottomRightRadius: '4px',
  },
  botBubble: {
    alignSelf: 'flex-start',
    background: 'rgba(255,255,255,0.06)',
    color: '#f0f4ff',
    borderBottomLeftRadius: '4px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  typing: {
    display: 'flex',
    gap: '4px',
    padding: '4px 0',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#8b95b3',
    animation: 'pulse 1s ease-in-out infinite',
  },
  quickRow: {
    display: 'flex',
    gap: '6px',
    padding: '8px 16px',
    overflowX: 'auto',
    borderTop: '1px solid rgba(255,255,255,0.04)',
  },
  quickBtn: {
    flexShrink: 0,
    padding: '6px 12px',
    fontSize: '0.65rem',
    fontWeight: 500,
    color: '#00d4ff',
    background: 'rgba(0,212,255,0.08)',
    border: '1px solid rgba(0,212,255,0.15)',
    borderRadius: '999px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(0,0,0,0.2)',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    fontSize: '0.8rem',
    color: '#f0f4ff',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  sendBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #00d4ff, #7c3aed)',
    border: 'none',
    color: 'white',
    fontSize: '1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s',
  },
};
