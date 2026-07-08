import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Home, 
  PieChart, 
  Briefcase, 
  MessageSquare, 
  Target, 
  Settings, 
  ShieldAlert, 
  Wifi, 
  Battery, 
  Fingerprint, 
  Unlock 
} from 'lucide-react';

export default function PhoneMockup({ children }) {
  const { 
    isAuthenticated, 
    activeScreen, 
    setActiveScreen, 
    isAppLocked, 
    setIsAppLocked, 
    isBiometricEnrolled,
    isBiometricAuthenticated, 
    setIsBiometricAuthenticated,
    user
  } = useContext(AppContext);

  const [time, setTime] = useState('');
  const [bioScanning, setBioScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('Tap to simulate scan');

  // Clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Simulating the fingerprint scanning sequence
  const handleSimulateScan = () => {
    if (bioScanning) return;
    setBioScanning(true);
    setScanMessage('Scanning fingerprint...');
    
    setTimeout(() => {
      setBioScanning(false);
      setIsBiometricAuthenticated(true);
      setIsAppLocked(false);
      setScanMessage('Scan Successful!');
    }, 1500);
  };

  const handlePasswordUnlock = () => {
    setIsBiometricAuthenticated(true);
    setIsAppLocked(false);
  };

  return (
    <div className="phone-mockup">
      {/* Notch */}
      <div className="phone-notch"></div>

      {/* Status Bar */}
      <div className="phone-status-bar">
        <span>{time}</span>
        <div className="status-right">
          <Wifi size={14} />
          <span>5G</span>
          <Battery size={16} />
          <span>98%</span>
        </div>
      </div>

      {/* Biometric Lock Overlay */}
      {isAuthenticated && isAppLocked && !isBiometricAuthenticated && (
        <div style={{
          position: 'absolute',
          top: 44,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 22, 40, 0.98)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '24px',
          textAlign: 'center'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '320px', padding: '30px 20px' }}>
            <div className="empty-state-avatar" style={{ fontSize: '48px', color: '#D4AF37', margin: '0 auto 16px auto' }}>
              🔒
            </div>
            <h2 style={{ fontSize: '20px', marginBottom: '8px', fontFamily: 'var(--font-title)' }}>
              Cashius Vault Locked
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', marginBottom: '24px' }}>
              WealthAvatar contains sensitive financial data. Please authenticate to access your portfolio.
            </p>

            {isBiometricEnrolled ? (
              <div style={{ display: 'flex', flexType: 'column', flexDirection: 'column', alignItems: 'center' }}>
                <div 
                  onClick={handleSimulateScan}
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    backgroundColor: bioScanning ? 'rgba(212, 175, 55, 0.2)' : 'var(--color-navy-light)',
                    border: `2px dashed ${bioScanning ? 'var(--color-success)' : 'var(--color-gold)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    marginBottom: '16px',
                    animation: bioScanning ? 'breathe 1s infinite' : 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Fingerprint size={44} color={bioScanning ? '#10B981' : '#D4AF37'} />
                </div>
                
                <span style={{ 
                  fontSize: '12px', 
                  color: bioScanning ? 'var(--color-success)' : 'var(--color-text-muted)',
                  fontWeight: '600'
                }}>
                  {scanMessage}
                </span>

                <button 
                  onClick={handlePasswordUnlock}
                  className="btn-secondary" 
                  style={{ marginTop: '24px', padding: '8px 12px', fontSize: '12px' }}
                >
                  Use Security PIN
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-warning)', marginBottom: '16px' }}>
                  Biometrics is disabled. Use secondary PIN to access dashboard.
                </p>
                <button onClick={handlePasswordUnlock} className="btn-primary">
                  Unlock Vault
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen View */}
      <div className="phone-screen">
        {children}
      </div>

      {/* Navigation Footer */}
      {isAuthenticated && (!isAppLocked || isBiometricAuthenticated) && (
        <div className="phone-nav-bar">
          <div 
            className={`nav-item ${activeScreen === 'Dashboard' ? 'active' : ''}`}
            onClick={() => setActiveScreen('Dashboard')}
          >
            <Home size={20} />
            <span>Overview</span>
          </div>

          <div 
            className={`nav-item ${activeScreen === 'Spending' ? 'active' : ''}`}
            onClick={() => setActiveScreen('Spending')}
          >
            <PieChart size={20} />
            <span>Spending</span>
          </div>

          <div 
            className={`nav-item ${activeScreen === 'Portfolio' ? 'active' : ''}`}
            onClick={() => setActiveScreen('Portfolio')}
          >
            <Briefcase size={20} />
            <span>Portfolio</span>
          </div>

          <div 
            className={`nav-item ${activeScreen === 'Chat' ? 'active' : ''}`}
            onClick={() => setActiveScreen('Chat')}
          >
            <MessageSquare size={20} />
            <span>Cashius AI</span>
          </div>

          <div 
            className={`nav-item ${activeScreen === 'Goals' ? 'active' : ''}`}
            onClick={() => setActiveScreen('Goals')}
          >
            <Target size={20} />
            <span>Goals</span>
          </div>

          <div 
            className={`nav-item ${activeScreen === 'Settings' ? 'active' : ''}`}
            onClick={() => setActiveScreen('Settings')}
          >
            <Settings size={20} />
            <span>Profile</span>
          </div>
        </div>
      )}
    </div>
  );
}
