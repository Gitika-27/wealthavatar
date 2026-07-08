import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Send, ArrowLeft, Bot, User } from 'lucide-react';

const CHAT_SUGGESTIONS = [
  "Evaluate my portfolio weightings",
  "Analyze June spending anomalies",
  "How do I correct my Home Purchase goal?",
  "Tell me about ELSS tax savings"
];

export default function AIChat() {
  const { chatHistory, fetchChatHistory, sendChatMessage, user } = useContext(AppContext);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  // Scroll to bottom on updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, sending]);

  const handleSend = async (text) => {
    const message = text || inputText;
    if (!message.trim() || sending) return;
    
    setInputText('');
    setSending(true);
    await sendChatMessage(message);
    setSending(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '10px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginTop: '10px' }}>
        <div className="avatar-portrait" style={{ width: '40px', height: '40px', animation: 'none' }}>
          <span style={{ fontSize: '20px' }}>👩‍💼</span>
        </div>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>Advising with Cashius</h2>
          <span style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: '600' }}>● Online Private Advisor</span>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div 
        ref={scrollRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          margin: '12px 0', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          paddingRight: '4px'
        }}
      >
        {chatHistory.length === 0 && (
          <div style={{ textAlign: 'center', margin: '40px 10px', color: 'var(--color-text-muted)' }}>
            <span style={{ fontSize: '36px' }}>💬</span>
            <h4 style={{ color: 'white', marginTop: '10px', fontSize: '14px' }}>Ask Cashius Anything</h4>
            <p style={{ fontSize: '12px', marginTop: '6px', lineHeight: '1.5' }}>
              I have access to your spending logs, portfolio holdings, and active goals. Ask me how to optimize your financial strategy!
            </p>
          </div>
        )}

        {chatHistory.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={idx}
              style={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              {!isUser && (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-navy-light)',
                  border: '1px solid var(--color-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  flexShrink: 0
                }}>
                  👩‍💼
                </div>
              )}
              
              <div 
                className="glass-card"
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  borderTopRightRadius: isUser ? '2px' : '12px',
                  borderTopLeftRadius: isUser ? '12px' : '2px',
                  maxWidth: '80%',
                  fontSize: '12.5px',
                  lineHeight: '1.5',
                  backgroundColor: isUser ? 'rgba(212, 175, 55, 0.1)' : 'var(--color-navy-card)',
                  borderColor: isUser ? 'rgba(212, 175, 55, 0.3)' : 'rgba(212, 175, 55, 0.15)',
                  whiteSpace: 'pre-wrap',
                  textAlign: 'left'
                }}
              >
                {msg.message}
              </div>

              {isUser && (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-navy-light)',
                  border: '1px solid var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  flexShrink: 0,
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {user?.name ? user.name[0] : 'U'}
                </div>
              )}
            </div>
          );
        })}

        {sending && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-navy-light)',
              border: '1px solid var(--color-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}>
              👩‍💼
            </div>
            <div className="glass-card" style={{ padding: '12px 16px', borderRadius: '12px', borderTopLeftRadius: '2px' }}>
              <div className="speech-wave">
                <span></span><span></span><span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion Chips */}
      {chatHistory.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600' }}>Suggested Questions:</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {CHAT_SUGGESTIONS.map((s, idx) => (
              <button 
                key={idx}
                onClick={() => handleSend(s)}
                className="glass-card"
                style={{ 
                  padding: '6px 10px', 
                  fontSize: '11px', 
                  borderRadius: '16px', 
                  color: 'white',
                  borderColor: 'rgba(212, 175, 55, 0.2)',
                  backgroundColor: 'rgba(22, 42, 69, 0.3)'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-gold)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.2)'}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TextInput Panel */}
      <div style={{ position: 'relative', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input 
          type="text" 
          className="form-input" 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="Ask Cashius about savings or portfolio..."
          onKeyDown={e => {
            if (e.key === 'Enter') handleSend();
          }}
          disabled={sending}
          style={{ flex: 1, paddingRight: '44px', borderRadius: '24px' }}
        />
        
        <button 
          onClick={() => handleSend()}
          disabled={!inputText.trim() || sending}
          style={{
            position: 'absolute',
            right: '6px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: inputText.trim() && !sending ? 'var(--color-gold)' : 'var(--color-navy-light)',
            color: inputText.trim() && !sending ? '#0A1628' : 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
        >
          <Send size={16} />
        </button>
      </div>

    </div>
  );
}
