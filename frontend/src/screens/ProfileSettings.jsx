import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  User, 
  ShieldCheck, 
  EyeOff, 
  Eye, 
  Clock, 
  Bell, 
  LogOut, 
  RefreshCw, 
  Lock 
} from 'lucide-react';

export default function ProfileSettings() {
  const { 
    user, 
    logout, 
    isBalanceHidden, 
    toggleBalancePrivacy, 
    isBiometricEnrolled, 
    toggleBiometricEnrollment,
    setActiveScreen 
  } = useContext(AppContext);

  const handleRetakeRisk = () => {
    localStorage.removeItem('onboarded_completed');
    setActiveScreen('Onboarding');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Profile & Settings</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Manage security keys & advisor preferences</p>
        </div>
      </div>

      {/* User Info card */}
      <div className="glass-card" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-gold-glow)',
          border: '1.5px solid var(--color-gold)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px'
        }}>
          👤
        </div>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'white' }}>{user?.name || 'Rajesh Kumar'}</h3>
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{user?.email || 'rajesh@example.com'}</span>
        </div>
      </div>

      {/* Risk Profile Card */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--color-gold)" />
            <h4 style={{ fontSize: '13px', fontWeight: '700' }}>Investment Risk Profile</h4>
          </div>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: '700', 
            color: 'var(--color-gold)',
            backgroundColor: 'var(--color-gold-glow)',
            padding: '4px 8px',
            borderRadius: '12px'
          }}>
            {user?.riskProfile || 'Moderate'}
          </span>
        </div>
        
        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
          Your risk profile determines how Cashius structures asset classes. Retake the profiling questionnaire to adjust recommendations.
        </p>

        <button 
          onClick={handleRetakeRisk}
          className="btn-secondary" 
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', padding: '8px' }}
        >
          <RefreshCw size={14} /> Retake Assessment
        </button>
      </div>

      {/* Security settings */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <Lock size={16} color="var(--color-gold)" /> Security & Visibility
        </h3>

        {/* Hide Balance Toggle */}
        <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>Mask Balances</h4>
            <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Hide numeric values on dashboard cards</p>
          </div>
          
          <button 
            onClick={toggleBalancePrivacy}
            style={{ 
              backgroundColor: isBalanceHidden ? 'var(--color-gold)' : 'var(--color-navy-dark)', 
              color: isBalanceHidden ? '#0A1628' : 'var(--color-text-muted)',
              width: '40px',
              height: '24px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isBalanceHidden ? 'flex-end' : 'flex-start',
              padding: '2px',
              border: '1.5px solid rgba(212,175,55,0.25)',
              transition: 'all 0.25s'
            }}
          >
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: isBalanceHidden ? '#0A1628' : 'var(--color-gold)' }}></div>
          </button>
        </div>

        {/* Biometric Enrolled Toggle */}
        <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>Biometric Login</h4>
            <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Enable Fingerprint/FaceID lock simulator</p>
          </div>
          
          <button 
            onClick={toggleBiometricEnrollment}
            style={{ 
              backgroundColor: isBiometricEnrolled ? 'var(--color-gold)' : 'var(--color-navy-dark)', 
              color: isBiometricEnrolled ? '#0A1628' : 'var(--color-text-muted)',
              width: '40px',
              height: '24px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isBiometricEnrolled ? 'flex-end' : 'flex-start',
              padding: '2px',
              border: '1.5px solid rgba(212,175,55,0.25)',
              transition: 'all 0.25s'
            }}
          >
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: isBiometricEnrolled ? '#0A1628' : 'var(--color-gold)' }}></div>
          </button>
        </div>

        {/* Session inactivity timeout indicator */}
        <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'white' }}>Session Timeout Guard</h4>
            <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Autolock active vault after inactivity</p>
          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> 5 Minutes
          </span>
        </div>
      </div>

      {/* Notification settings */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bell size={16} color="var(--color-gold)" /> Notification Alerts
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          <div style={{ display: 'flex', justify: 'space-between' }}>
            <span>Morning Advisory Tip (Pushes)</span>
            <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>Enabled</span>
          </div>
          <div style={{ display: 'flex', justify: 'space-between' }}>
            <span>Portfolio Rebalancing Alerts (Emails)</span>
            <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>Enabled</span>
          </div>
          <div style={{ display: 'flex', justify: 'space-between' }}>
            <span>Anomaly & Budget Warnings (SMS)</span>
            <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>Enabled</span>
          </div>
        </div>
      </div>

      {/* Log out button */}
      <button 
        onClick={logout}
        className="btn-secondary"
        style={{ 
          marginTop: '10px',
          borderColor: 'var(--color-danger)', 
          color: 'var(--color-danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.05)'
        }}
      >
        <LogOut size={16} /> Sign Out Safely
      </button>

    </div>
  );
}
