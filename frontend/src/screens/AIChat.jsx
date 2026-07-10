import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { Send, Plus, Trash2, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';

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
        <div key={lineIdx} style={{ display: 'flex', paddingLeft: `${indentLevel * 12 + 4}px`, margin: '4px 0', alignItems: 'flex-start' }}>
          <span style={{ marginRight: '6px', color: 'var(--color-gold)', fontWeight: 'bold' }}>•</span>
          <span style={{ flex: 1 }}>{parsedLine}</span>
        </div>
      );
    }
    if (line.trim() === '') {
      return <div key={lineIdx} style={{ height: '6px' }} />;
    }
    return <p key={lineIdx} style={{ margin: '3px 0' }}>{parsedLine}</p>;
  });
}

export default function AIChat() {
  const {
    chatHistory,
    setChatHistory,
    chatSessions,
    activeSessionId,
    setActiveSessionId,
    fetchChatSessions,
    fetchSessionMessages,
    createChatSession,
    deleteChatSession,
    sendChatMessage,
    user
  } = useContext(AppContext);

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  
  // Responsive / Layout States
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Auto close/open sidebar depending on screen change
      setSidebarOpen(!mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize: load sessions
  useEffect(() => {
    fetchChatSessions().then(() => {
      setSessionsLoaded(true);
    });
  }, [fetchChatSessions]);

  // When sessions load, pick active session or select new
  useEffect(() => {
    if (!sessionsLoaded) return;
    if (chatSessions.length === 0) {
      setActiveSessionId('new');
    } else if (!activeSessionId) {
      // Find the most recent session
      setActiveSessionId(chatSessions[0].id);
    }
  }, [chatSessions, activeSessionId, sessionsLoaded, setActiveSessionId]);

  // Load messages when active session changes
  useEffect(() => {
    if (activeSessionId) {
      fetchSessionMessages(activeSessionId);
    }
  }, [activeSessionId, fetchSessionMessages]);

  // Scroll to bottom on message updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, sending]);

  const handleNewChat = () => {
    if (activeSessionId === 'new') {
      if (isMobile) setSidebarOpen(false);
      return; // Already in a virtual new chat session
    }
    setActiveSessionId('new');
    if (typeof setChatHistory === 'function') {
      setChatHistory([]);
    }
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleSelectSession = (sessionId) => {
    if (sessionId === activeSessionId) return;
    setActiveSessionId(sessionId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    
    // If it's a virtual session (un-persisted), just switch away
    if (sessionToDelete.id === 'new') {
      setShowDeleteConfirm(false);
      setSessionToDelete(null);
      handleNewChat();
      return;
    }

    setIsDeleting(true);
    const success = await deleteChatSession(sessionToDelete.id);
    setIsDeleting(false);
    
    if (success) {
      if (sessionToDelete.id === activeSessionId) {
        const remaining = chatSessions.filter(s => s.id !== sessionToDelete.id);
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else {
          setActiveSessionId('new');
        }
      }
      setShowDeleteConfirm(false);
      setSessionToDelete(null);
    } else {
      alert('Failed to delete chat session.');
    }
  };

  const handleSend = async (text) => {
    const message = text || inputText;
    if (!message.trim() || sending || !activeSessionId) return;
    
    setInputText('');
    setSending(true);

    let sessionId = activeSessionId;
    
    // If we are in the virtual 'new' chat session, persist it first
    if (sessionId === 'new') {
      const newId = await createChatSession();
      if (newId) {
        sessionId = newId;
        setActiveSessionId(newId);
      } else {
        setSending(false);
        alert('Failed to start a new chat session.');
        return;
      }
    }

    await sendChatMessage(message, sessionId);
    setSending(false);
    inputRef.current?.focus();
  };

  const formatSessionTitle = (title, maxLen = 22) => {
    if (!title) return 'New Chat';
    return title.length > maxLen ? title.slice(0, maxLen) + '…' : title;
  };

  const formatSessionDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Generate sessions list with the virtual 'new' session prepended if active
  const displaySessions = [...chatSessions];
  if (activeSessionId === 'new') {
    const hasNew = displaySessions.some(s => s.id === 'new');
    if (!hasNew) {
      displaySessions.unshift({
        id: 'new',
        title: 'New Chat',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      gap: '0',
      overflow: 'hidden',
      position: 'relative',
      minHeight: '0'
    }}>

      {/* Mobile Sidebar backdrop overlay */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(10, 22, 40, 0.75)',
            zIndex: 95,
            backdropFilter: 'blur(3px)',
            transition: 'opacity 0.25s ease'
          }}
        />
      )}

      {/* Sessions Sidebar */}
      <div style={
        isMobile ? {
          position: 'absolute',
          top: 0,
          left: sidebarOpen ? 0 : '-220px',
          width: '220px',
          height: '100%',
          zIndex: 100,
          backgroundColor: 'var(--color-navy-dark)',
          boxShadow: sidebarOpen ? '4px 0 24px rgba(0, 0, 0, 0.7)' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRight: '1px solid rgba(0, 148, 94, 0.2)',
          display: 'flex',
          flexDirection: 'column'
        } : {
          width: sidebarOpen ? '220px' : '0',
          minWidth: sidebarOpen ? '220px' : '0',
          maxWidth: sidebarOpen ? '220px' : '0',
          overflow: 'hidden',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          flexShrink: 0,
          borderRight: sidebarOpen ? '1px solid rgba(0, 148, 94, 0.12)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-navy-dark)',
          borderRadius: '12px 0 0 12px'
        }
      }>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px 10px', minWidth: '220px' }}>
          
          {/* Sidebar header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Conversations
            </span>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 148, 94, 0.1)',
              border: '1px solid rgba(0, 148, 94, 0.25)',
              color: 'var(--color-gold)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '14px',
              transition: 'all 0.2s',
              width: '100%'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0, 148, 94, 0.18)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0, 148, 94, 0.1)'}
          >
            <Plus size={14} />
            New Chat
          </button>

          {/* Sessions List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {displaySessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 8px', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                No conversations yet
              </div>
            ) : (
              displaySessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    borderRadius: '8px',
                    backgroundColor: session.id === activeSessionId
                      ? 'rgba(0, 148, 94, 0.15)'
                      : 'transparent',
                    border: session.id === activeSessionId
                      ? '1px solid rgba(0, 148, 94, 0.25)'
                      : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    gap: '8px'
                  }}
                  onMouseEnter={e => {
                    if (session.id !== activeSessionId) {
                      e.currentTarget.style.backgroundColor = 'rgba(0, 148, 94, 0.06)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (session.id !== activeSessionId) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: session.id === activeSessionId ? '700' : '500',
                      color: session.id === activeSessionId ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: '1.4'
                    }}>
                      {formatSessionTitle(session.title)}
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', marginTop: '2px', opacity: 0.7 }}>
                      {formatSessionDate(session.updatedAt || session.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setSessionToDelete(session);
                      setShowDeleteConfirm(true);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-muted)',
                      opacity: session.id === activeSessionId ? 0.8 : 0.4,
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      borderRadius: '4px',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={e => e.currentTarget.style.opacity = session.id === activeSessionId ? '0.8' : '0.4'}
                    title="Delete conversation"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        paddingBottom: '10px',
        padding: isMobile ? '0 12px 10px 12px' : '0 0 10px 20px',
        height: '100%'
      }}>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--color-navy-light)',
          marginTop: '10px'
        }}>
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            style={{
              background: 'none',
              border: '1px solid rgba(0,148,94,0.2)',
              borderRadius: '8px',
              color: 'var(--color-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              cursor: 'pointer',
              flexShrink: 0
            }}
            title={sidebarOpen ? "Hide conversations" : "Show conversations"}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {/* Simple avatar representation */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-navy-light) 0%, var(--color-navy-dark) 100%)',
            border: '1.5px solid var(--color-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            flexShrink: 0
          }}>
            👩‍💼
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              fontSize: '14px',
              fontWeight: '700',
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              margin: 0
            }}>
              {activeSessionId === 'new' 
                ? 'New Chat' 
                : (chatSessions.find(s => s.id === activeSessionId)?.title || 'Cashius AI')}
            </h2>
            <span style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: '600', display: 'block', marginTop: '2px' }}>
              ● Online Private Advisor
            </span>
          </div>

          {/* New Chat shortcut button on header (Desktop only) */}
          {!isMobile && (
            <button
              onClick={handleNewChat}
              style={{
                background: 'rgba(0,148,94,0.08)',
                border: '1px solid rgba(0,148,94,0.2)',
                borderRadius: '8px',
                color: 'var(--color-gold)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '600',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,148,94,0.15)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,148,94,0.08)'}
              title="New Chat"
            >
              <Plus size={12} /> New Chat
            </button>
          )}
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
                width: '28px', height: '28px', borderRadius: '50%',
                backgroundColor: 'var(--color-navy-light)', border: '1px solid var(--color-gold)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
              }}>👩‍💼</div>
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
            ref={inputRef}
            type="text"
            className="form-input"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Ask Cashius about savings or portfolio..."
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
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

      {/* Delete Session Confirmation Modal */}
      {showDeleteConfirm && sessionToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(10, 22, 40, 0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '320px', padding: '24px', backgroundColor: 'var(--color-navy-dark)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <MessageSquare size={18} color="var(--color-danger)" />
              <h3 style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'var(--font-title)' }}>Delete Conversation</h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '20px', lineHeight: '1.5' }}>
              Delete "{formatSessionTitle(sessionToDelete.title, 40)}"? This conversation and all its messages will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowDeleteConfirm(false); setSessionToDelete(null); }}
                className="btn-secondary"
                style={{ width: 'auto', padding: '8px 16px', fontSize: '12px', borderRadius: '8px' }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                className="btn-primary"
                style={{ width: 'auto', padding: '8px 16px', fontSize: '12px', borderRadius: '8px', backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
