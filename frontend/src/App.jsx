import { useContext } from 'react';
import { AppContext } from './context/AppContext';
import PhoneMockup from './components/PhoneMockup';

// Import Screens
import Onboarding from './screens/Onboarding';
import AvatarHome from './screens/AvatarHome';
import Dashboard from './screens/Dashboard';
import SpendingAnalyzer from './screens/SpendingAnalyzer';
import InvestmentPortfolio from './screens/InvestmentPortfolio';
import GoalPlanner from './screens/GoalPlanner';
import AIChat from './screens/AIChat';
import MarketInsights from './screens/MarketInsights';
import ProfileSettings from './screens/ProfileSettings';
import Notifications from './screens/Notifications';

export default function App() {
  const { activeScreen, isAuthenticated, setActiveScreen } = useContext(AppContext);

  // Simple screen selector
  const renderScreen = () => {
    switch (activeScreen) {
      case 'Onboarding':
        return <Onboarding />;
      case 'AvatarHome':
        return <AvatarHome />;
      case 'Dashboard':
        return <Dashboard />;
      case 'Spending':
        return <SpendingAnalyzer />;
      case 'Portfolio':
        return <InvestmentPortfolio />;
      case 'Goals':
        return <GoalPlanner />;
      case 'Chat':
        return <AIChat />;
      case 'Market':
        return <MarketInsights />;
      case 'Settings':
        return <ProfileSettings />;
      case 'Notifications':
        return <Notifications />;
      default:
        return <AvatarHome />;
    }
  };

  return (
    <div className="app-container">
      
      {/* Dynamic Market Insights Quick Banner */}
      {isAuthenticated && activeScreen !== 'Onboarding' && activeScreen !== 'Market' && (
        <div 
          onClick={() => setActiveScreen('Market')}
          className="market-insights-banner glass-card animate-float"
          style={{
            marginBottom: '16px',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            backgroundColor: 'rgba(212, 175, 55, 0.08)',
            border: '1px solid rgba(212, 175, 55, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📢</span>
            <span style={{ color: 'white', fontWeight: '600' }}>
              Central bank repo rate holds steady at 6.5%. Tap for details.
            </span>
          </div>
          <span style={{ color: 'var(--color-gold)', fontWeight: '700' }}>View →</span>
        </div>
      )}

      {/* Main application content */}
      <PhoneMockup>
        {renderScreen()}
      </PhoneMockup>

    </div>
  );
}
