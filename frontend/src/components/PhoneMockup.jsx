import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Home, 
  PieChart, 
  Briefcase, 
  MessageSquare, 
  Target, 
  Settings, 
  Fingerprint
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
    setIsBiometricAuthenticated
  } = useContext(AppContext);

  const [bioScanning, setBioScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('Tap to simulate scan');

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

  const navigationItems = [
    { screen: 'Dashboard', label: 'Overview', Icon: Home },
    { screen: 'Spending', label: 'Spending', Icon: PieChart },
    { screen: 'Portfolio', label: 'Portfolio', Icon: Briefcase },
    { screen: 'Chat', label: 'Cashius AI', Icon: MessageSquare },
    { screen: 'Goals', label: 'Goals', Icon: Target },
    { screen: 'Settings', label: 'Profile', Icon: Settings }
  ];

  const renderNavigation = (className) => (
    <nav className={className} aria-label="Main navigation">
      {navigationItems.map(({ screen, label, Icon }) => (
        <button
          key={screen}
          type="button"
          className={`nav-item ${activeScreen === screen ? 'active' : ''}`}
          onClick={() => setActiveScreen(screen)}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className="app-layout">

      {isAuthenticated && (!isAppLocked || isBiometricAuthenticated) && renderNavigation('app-sidebar')}

      {/* Biometric Lock Overlay */}
      {isAuthenticated && isAppLocked && !isBiometricAuthenticated && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(244, 247, 245, 0.96)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '24px',
          textAlign: 'center'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '320px', padding: '30px 20px', backgroundColor: 'var(--color-navy-dark)' }}>
            <div className="empty-state-avatar" style={{ fontSize: '48px', color: 'var(--color-gold)', margin: '0 auto 16px auto' }}>
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
                    backgroundColor: bioScanning ? 'rgba(0, 148, 94, 0.15)' : 'var(--color-navy-light)',
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
                  <Fingerprint size={44} color={bioScanning ? 'var(--color-success)' : 'var(--color-gold)'} />
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
      <div className="app-screen">
        {children}
      </div>

      {/* Mobile navigation */}
      {isAuthenticated && (!isAppLocked || isBiometricAuthenticated) && renderNavigation('app-nav-bar')}
    </div>
  );
}
