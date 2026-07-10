import React, { useContext, useState, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Send, ArrowLeft, Bot, User } from 'lucide-react';

const CHAT_SUGGESTIONS = [
  "Evaluate my portfolio weightings",
  "Analyze June spending anomalies",
  "How do I correct my Home Purchase goal?",
  "Tell me about ELSS tax savings"
];

function parseBoldText(text) {
  if (!text) return "";
  const parts = text.split('**');
  if (parts.length === 1) return text;
  
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return <strong key={idx} style={{ fontWeight: '700', color: 'var(--color-gold)' }}>{part}</strong>;
    }
    return part;
  });
}

function parseMarkdown(text) {
  if (!text) return "";
  
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    let content = line;
    
    // 1. Headings
    if (content.startsWith('### ')) {
      return (
        <h4 key={lineIdx} style={{ fontSize: '13px', fontWeight: '700', marginTop: '12px', marginBottom: '6px', color: 'var(--color-text-primary)' }}>
          {parseBoldText(content.slice(4))}
        </h4>
      );
    }
    if (content.startsWith('## ')) {
      return (
        <h3 key={lineIdx} style={{ fontSize: '14px', fontWeight: '700', marginTop: '14px', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
          {parseBoldText(content.slice(3))}
        </h3>
      );
    }
    
    // 2. List Items
    let isBullet = false;
    let indentLevel = 0;
    
    const trimmed = content.trimStart();
    const leadingSpaces = content.length - trimmed.length;
    indentLevel = Math.floor(leadingSpaces / 2);
    
    if (trimmed.startsWith('* ') || trimmed.startsWith('+ ') || trimmed.startsWith('- ')) {
      isBullet = true;
      content = trimmed.slice(2);
    }
    
    const parsedLine = parseBoldText(content);
    
    if (isBullet) {
      return (
        <div 
          key={lineIdx} 
          style={{ 
            display: 'flex', 
            paddingLeft: `${indentLevel * 12 + 4}px`, 
            margin: '4px 0',
            alignItems: 'flex-start' 
          }}
        >
          <span style={{ marginRight: '6px', color: 'var(--color-gold)', fontWeight: 'bold' }}>•</span>
          <span style={{ flex: 1 }}>{parsedLine}</span>
        </div>
      );
    }
    
    if (line.trim() === '') {
      return <div key={lineIdx} style={{ height: '6px' }} />;
    }
    
    return (
      <p key={lineIdx} style={{ margin: '3px 0' }}>
        {parsedLine}
      </p>
    );
  });
}

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
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '12px', borderBottom: '1px solid var(--color-navy-light)', marginTop: '10px' }}>
        <div className="avatar-portrait" style={{ width: '40px', height: '40px', animation: 'none' }}>
          <span style={{ fontSize: '20px' }}>👩‍💼</span>
        </div>
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--color-text-primary)' }}>Advising with Cashius</h2>
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
            <h4 style={{ color: 'var(--color-text-primary)', marginTop: '10px', fontSize: '14px' }}>Ask Cashius Anything</h4>
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
                  maxWidth: '85%',
                  fontSize: '12.5px',
                  lineHeight: '1.5',
                  backgroundColor: isUser ? 'rgba(0, 148, 94, 0.08)' : 'var(--color-navy-dark)',
                  borderColor: isUser ? 'rgba(0, 148, 94, 0.25)' : 'rgba(0, 148, 94, 0.1)',
                  textAlign: 'left',
                  color: 'var(--color-text-primary)'
                }}
              >
                {parseMarkdown(msg.message)}
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
                  color: 'var(--color-gold)',
                  fontWeight: '700'
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
                  padding: '6px 12px', 
                  fontSize: '11px', 
                  borderRadius: '16px', 
                  color: 'var(--color-text-primary)',
                  borderColor: 'rgba(0, 148, 94, 0.15)',
                  backgroundColor: 'var(--color-navy-dark)'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-gold)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0, 148, 94, 0.15)'}
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
            color: inputText.trim() && !sending ? '#FFFFFF' : 'var(--color-text-muted)',
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
