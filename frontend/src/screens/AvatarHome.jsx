import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Shield, Mail, Lock, Lightbulb, ArrowRight, Fingerprint } from 'lucide-react';

export default function AvatarHome() {
  const { login, isAuthenticated, user, dailyTip, fetchNudges, logout, setActiveScreen } = useContext(AppContext);
  
  const [email, setEmail] = useState('rajesh@example.com');
  const [password, setPassword] = useState('Password123');
  const [error, setError] = useState('');
  const [avatarMessage, setAvatarMessage] = useState('Welcome! Please sign in to access your wealth account.');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNudges();
      setAvatarMessage(`Good day, ${user?.name || 'Customer'}! I am Cashius. What shall we analyze today?`);
    }
  }, [isAuthenticated, fetchNudges, user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Invalid credentials');
    }
  };

  const handleTapAvatar = () => {
    if (speaking) return;
    setSpeaking(true);
    const greetings = [
      "I am Cashius, your wealth co-pilot. I analyze your spending and portfolios to maximize returns.",
      "Did you know? Reviewing your investments quarterly can improve performance by up to 2%!",
      "I'm keeping a watch on your goals. Your emergency fund has a strong 90% completion score.",
      "Sovereign Gold Bonds are open this week. Tap the Portfolio tab to check rebalance options!"
    ];
    const phrase = greetings[Math.floor(Math.random() * greetings.length)];
    setAvatarMessage(phrase);
    
    // Simulate speaking duration
    setTimeout(() => {
      setSpeaking(false);
    }, 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      
      {/* Header Avatar Section */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <div className="avatar-container" onClick={handleTapAvatar}>
          <div className="avatar-halo">
            <div className="avatar-portrait">
              <span className="avatar-face" style={{ transform: speaking ? 'scale(1.05)' : 'none', transition: 'transform 0.2s' }}>
                👩‍💼
              </span>
              <div className="online-indicator"></div>
            </div>
          </div>
          {speaking && (
            <div className="speech-wave">
              <span></span><span></span><span></span><span></span><span></span>
            </div>
          )}
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
          {speaking ? 'Cashius Speaking' : 'Cashius AI'}
        </h2>
        
        {/* Animated Speech Bubble */}
        <div className="glass-card" style={{
          padding: '12px 16px',
          margin: '0 12px 20px 12px',
          borderRadius: '12px',
          fontSize: '13px',
          lineHeight: '1.5',
          borderLeft: '3px solid var(--color-gold)',
          backgroundColor: 'rgba(212, 175, 55, 0.05)',
          position: 'relative'
        }}>
          {avatarMessage}
        </div>
      </div>

      {/* Main Flow Section */}
      {!isAuthenticated ? (
        // Not logged in: Show Login Form
        <form onSubmit={handleLogin} className="glass-card" style={{ marginBottom: '10px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={18} color="#D4AF37" /> Secure Banking Login
          </h3>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--color-danger)',
              color: 'var(--color-danger)',
              padding: '8px',
              borderRadius: '6px',
              fontSize: '12px',
              marginBottom: '12px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Customer Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                className="form-input" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: '38px' }}
                required 
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">PIN / Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                className="form-input" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: '38px' }}
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn-primary">
            Sign In Securely
          </button>

          <p style={{ color: 'var(--color-text-muted)', fontSize: '11px', textAlign: 'center', marginTop: '12px' }}>
            Demo User: rajesh@example.com / Password123
          </p>
        </form>
      ) : (
        // Logged in: Show Quick Actions + Tip of the Day
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '10px' }}>
          
          {/* Tip of the Day Card */}
          <div className="glass-card" style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Lightbulb size={20} color="#D4AF37" />
            </div>
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-gold)', marginBottom: '4px' }}>
                Tip of the Day
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                {dailyTip || "SIP is the absolute key to building long-term wealth in volatile equity markets. Re-allocate idle assets."}
              </p>
            </div>
          </div>

          {/* Quick Nav Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={() => setActiveScreen('Dashboard')} 
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Go to Dashboard <ArrowRight size={16} />
            </button>
            
            <button 
              onClick={() => setActiveScreen('Chat')} 
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Ask Cashius a Question
            </button>
          </div>

          <button 
            onClick={logout} 
            style={{ 
              backgroundColor: 'transparent', 
              color: 'var(--color-danger)', 
              fontSize: '12px', 
              fontWeight: '600', 
              textAlign: 'center',
              padding: '6px 0'
            }}
          >
            Sign Out Session
          </button>
        </div>
      )}

      {/* Footer Security Badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        color: 'var(--color-text-muted)',
        fontSize: '10px',
        padding: '10px 0'
      }}>
        <span>🛡️ 256-Bit SSL Encryption</span>
      </div>
    </div>
  );
}
