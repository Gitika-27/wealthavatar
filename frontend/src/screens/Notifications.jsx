import React, { useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  ArrowLeft, 
  Bell, 
  Lightbulb, 
  AlertOctagon, 
  AlertTriangle, 
  TrendingUp, 
  PartyPopper, 
  Info,
  ShieldCheck
} from 'lucide-react';

export default function Notifications() {
  const { 
    nudges, 
    dailyTip, 
    fetchNudges, 
    isBalanceHidden, 
    setActiveScreen, 
    loading 
  } = useContext(AppContext);

  useEffect(() => {
    fetchNudges();
  }, [fetchNudges]);

  // Mask sensitive numbers in notifications if privacy is active
  const formatText = (text) => {
    if (isBalanceHidden) {
      // Replaces rupee amounts e.g., ₹24,000 or ₹8000 with ••••
      return text.replace(/₹\d+(,[,\d]*)*(\.\d+)?/g, '••••');
    }
    return text;
  };

  // Maps nudge type to appropriate color and icon
  const getNudgeStyle = (type) => {
    switch (type) {
      case 'CRITICAL':
        return {
          icon: <AlertOctagon size={18} color="var(--color-danger)" />,
          borderColor: 'rgba(239, 68, 68, 0.4)',
          bgColor: 'rgba(239, 68, 68, 0.05)',
          badgeBg: 'rgba(239, 68, 68, 0.15)',
          badgeColor: 'var(--color-danger)'
        };
      case 'WARNING':
        return {
          icon: <AlertTriangle size={18} color="var(--color-warning)" />,
          borderColor: 'rgba(245, 158, 11, 0.4)',
          bgColor: 'rgba(245, 158, 11, 0.04)',
          badgeBg: 'rgba(245, 158, 11, 0.15)',
          badgeColor: 'var(--color-warning)'
        };
      case 'ACTION':
        return {
          icon: <TrendingUp size={18} color="var(--color-gold)" />,
          borderColor: 'rgba(212, 175, 55, 0.4)',
          bgColor: 'rgba(212, 175, 55, 0.04)',
          badgeBg: 'var(--color-gold-glow)',
          badgeColor: 'var(--color-gold)'
        };
      case 'CELEBRATION':
        return {
          icon: <PartyPopper size={18} color="var(--color-success)" />,
          borderColor: 'rgba(16, 185, 129, 0.4)',
          bgColor: 'rgba(16, 185, 129, 0.04)',
          badgeBg: 'rgba(16, 185, 129, 0.15)',
          badgeColor: 'var(--color-success)'
        };
      case 'INFO':
      default:
        return {
          icon: <Info size={18} color="var(--color-text-muted)" />,
          borderColor: 'rgba(148, 163, 184, 0.25)',
          bgColor: 'rgba(148, 163, 184, 0.04)',
          badgeBg: 'rgba(148, 163, 184, 0.15)',
          badgeColor: 'var(--color-text-muted)'
        };
    }
  };

  if (loading && !dailyTip && nudges.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'center' }}>
        <div className="skeleton skeleton-card" style={{ height: '50px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '120px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '100px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '100px' }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
        <button 
          onClick={() => setActiveScreen('Dashboard')}
          style={{
            backgroundColor: 'var(--color-navy-light)',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-gold)'
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '700' }}>Alerts & Nudges</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Real-time notifications from Cashius</p>
        </div>
      </div>

      {/* Morning Advisor Tip of the day */}
      {dailyTip && (
        <div className="glass-card" style={{
          borderLeft: '4px solid var(--color-gold)',
          backgroundColor: 'rgba(212, 175, 55, 0.05)',
          padding: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Lightbulb size={18} color="var(--color-gold)" />
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-gold)' }}>Morning Advisory Tip</h3>
          </div>
          <p style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--color-text-primary)' }}>
            "{formatText(dailyTip)}"
          </p>
        </div>
      )}

      {/* Nudges List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, paddingBottom: '10px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bell size={15} color="var(--color-gold)" /> Active Alerts ({nudges.length})
        </h3>

        {nudges.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 10px', 
            color: 'var(--color-text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }} className="glass-card">
            <span style={{ fontSize: '36px' }}>🎉</span>
            <h4 style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>You're All Caught Up</h4>
            <p style={{ fontSize: '12px', lineHeight: '1.5' }}>
              Cashius hasn't flagged any budget excesses, anomaly transactions, or rebalance issues today. Excellent work!
            </p>
          </div>
        ) : (
          nudges.map((nudge, idx) => {
            const style = getNudgeStyle(nudge.type);
            return (
              <div 
                key={idx}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  padding: '14px',
                  border: `1px solid ${style.borderColor}`,
                  backgroundColor: style.bgColor,
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {style.icon}
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>
                      {nudge.title}
                    </span>
                  </div>
                  
                  <span style={{
                    fontSize: '9px',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                    color: style.badgeColor,
                    backgroundColor: style.badgeBg,
                    padding: '3px 6px',
                    borderRadius: '8px'
                  }}>
                    {nudge.category}
                  </span>
                </div>

                <p style={{ fontSize: '11.5px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
                  {formatText(nudge.message)}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Footer encryption indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        color: 'var(--color-text-muted)',
        fontSize: '9px',
        marginTop: 'auto',
        padding: '6px 0'
      }}>
        <ShieldCheck size={12} color="var(--color-success)" />
        <span>Secure Session • End-to-End Encrypted</span>
      </div>

    </div>
  );
}
