import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Sliders, 
  Compass, 
  CheckCircle,
  HelpCircle 
} from 'lucide-react';

const COLORS = {
  Equity: '#3B82F6',
  Debt: '#10B981',
  Gold: '#F59E0B',
  Cash: '#94A3B8'
};

const INDIAN_FUNDS = [
  { name: 'Nifty 50 Index Fund (SIP)', class: 'Equity', expectedReturn: '12-14%' },
  { name: 'Small Cap Mutual Fund (SIP)', class: 'Equity', expectedReturn: '15-18%' },
  { name: 'Debt Savings Fund (FD-Like)', class: 'Debt', expectedReturn: '6.5-7.5%' },
  { name: 'Sovereign Gold Bonds (SGB Series VII)', class: 'Gold', expectedReturn: '8% + Interest' }
];

export default function InvestmentPortfolio() {
  const { portfolioData, fetchPortfolio, configureSip, loading, isBalanceHidden } = useContext(AppContext);
  const [showSipModal, setShowSipModal] = useState(false);
  const [selectedFund, setSelectedFund] = useState(INDIAN_FUNDS[0]);
  const [sipAmount, setSipAmount] = useState(15000);
  const [sipSuccessMsg, setSipSuccessMsg] = useState('');

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const renderAmount = (val) => {
    if (isBalanceHidden) return '••••••';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  if (loading && !portfolioData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'center' }}>
        <div className="skeleton skeleton-card" style={{ height: '180px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '220px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '200px' }}></div>
      </div>
    );
  }

  const data = portfolioData || {
    totalValue: 658000,
    todayGainLoss: 12500,
    gainLossPercentage: 1.93,
    riskProfile: 'Moderate',
    holdings: [
      { id: 1, assetClass: 'Equity', assetName: 'Top 100 Mutual Fund (SIP)', units: 452.12, purchasePrice: 110.50, currentValue: 62500.00 },
      { id: 2, assetClass: 'Equity', assetName: 'Reliance Industries Ltd Stocks', units: 15.00, purchasePrice: 2450.00, currentValue: 43500.00 },
      { id: 3, assetClass: 'Equity', assetName: 'Infosys Ltd Stocks', units: 25.00, purchasePrice: 1380.00, currentValue: 39000.00 },
      { id: 4, assetClass: 'Debt', assetName: 'Public Provident Fund (PPF)', units: 1.00, purchasePrice: 220000.00, currentValue: 220000.00 },
      { id: 5, assetClass: 'Debt', assetName: 'Fixed Deposit (FD)', units: 1.00, purchasePrice: 150000.00, currentValue: 165000.00 },
      { id: 6, assetClass: 'Gold', assetName: 'Sovereign Gold Bonds (SGB)', units: 10.00, purchasePrice: 6200.00, currentValue: 74000.00 },
      { id: 7, assetClass: 'Cash', assetName: 'Savings Account Balance', units: 1.00, purchasePrice: 56000.00, currentValue: 56000.00 }
    ],
    allocation: [
      { name: 'Equity', value: 145000, percentage: 22 },
      { name: 'Debt', value: 385000, percentage: 59 },
      { name: 'Gold', value: 74000, percentage: 11 },
      { name: 'Cash', value: 56000, percentage: 8 }
    ],
    recommendations: [
      { type: 'Rebalance', assetClass: 'Equity', message: 'Your Equity Allocation (22%) is below Moderate guidelines (50%). Consider starting a Mutual Fund SIP.', action: 'Increase Mutual Fund SIP' }
    ]
  };

  const handleSetupSip = async () => {
    const success = await configureSip(sipAmount, selectedFund.name);
    if (success) {
      setSipSuccessMsg(`Successfully setup SIP of ₹${sipAmount.toLocaleString('en-IN')}/month for ${selectedFund.name}!`);
      setTimeout(() => {
        setSipSuccessMsg('');
        setShowSipModal(false);
      }, 2500);
    }
  };

  // Get risk meter width based on user risk
  const getRiskMeterLeft = () => {
    if (data.riskProfile === 'Conservative') return '16%';
    if (data.riskProfile === 'Moderate') return '50%';
    return '83%';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Investment Portfolio</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Real-time valuation & asset balancing</p>
        </div>
      </div>

      {/* Portfolio Value Summary Card */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '20px 16px' }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', fontWeight: '600' }}>
          Total Portfolio Value
        </span>
        <h2 className="gold-text-gradient" style={{ fontSize: '28px', margin: '4px 0 8px 0', fontFamily: 'var(--font-title)' }}>
          {renderAmount(data.totalValue)}
        </h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            {data.todayGainLoss >= 0 ? (
              <>
                <TrendingUp size={14} color="var(--color-success)" />
                <span style={{ color: 'var(--color-success)', fontWeight: '700' }}>
                  +{renderAmount(data.todayGainLoss)} (+{data.gainLossPercentage}%)
                </span>
              </>
            ) : (
              <>
                <TrendingDown size={14} color="var(--color-danger)" />
                <span style={{ color: 'var(--color-danger)', fontWeight: '700' }}>
                  {renderAmount(data.todayGainLoss)} ({data.gainLossPercentage}%)
                </span>
              </>
            )}
            <span style={{ color: 'var(--color-text-muted)' }}>Gain/Loss Today</span>
          </div>
        </div>
      </div>

      {/* Risk Profile Meter */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px' }}>Risk Spectrum Alignment</h3>
        
        {/* Meter Line */}
        <div style={{ position: 'relative', height: '8px', backgroundColor: 'var(--color-navy-dark)', borderRadius: '4px', margin: '20px 0 10px 0' }}>
          
          {/* Color Gradient Markers */}
          <div style={{ position: 'absolute', left: 0, width: '33.3%', height: '100%', borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px', background: 'linear-gradient(90deg, #10B981, #34D399)' }}></div>
          <div style={{ position: 'absolute', left: '33.3%', width: '33.3%', height: '100%', background: 'linear-gradient(90deg, #34D399, #FBBF24)' }}></div>
          <div style={{ position: 'absolute', left: '66.6%', width: '33.3%', height: '100%', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', background: 'linear-gradient(90deg, #FBBF24, #EF4444)' }}></div>
          
          {/* Active pointer indicator */}
          <div style={{
            position: 'absolute',
            left: getRiskMeterLeft(),
            top: '-6px',
            transform: 'translateX(-50%)',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-gold)',
            border: '3px solid var(--color-navy-dark)',
            boxShadow: '0 0 10px var(--color-gold)',
            transition: 'left 0.5s ease',
            zIndex: 10
          }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: '600' }}>
          <span>CONSERVATIVE</span>
          <span>MODERATE</span>
          <span>AGGRESSIVE</span>
        </div>
        
        <p style={{ fontSize: '12px', color: 'var(--color-gold)', textAlign: 'center', marginTop: '12px', fontWeight: '600' }}>
          Profile: {data.riskProfile} Appetite
        </p>
      </div>

      {/* Recharts Allocation Donut */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px' }}>Asset Allocation</h3>
        
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', height: '130px' }}>
          <div style={{ width: '50%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.allocation}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={48}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.allocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [renderAmount(value), 'Value']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Custom legend grid */}
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
            {data.allocation.map((entry, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justify: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[entry.name] }}></span>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: '500' }}>{entry.name}</span>
                </div>
                <span style={{ fontWeight: '700' }}>
                  {entry.percentage}% ({renderAmount(entry.value)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations Panel */}
      {data.recommendations.length > 0 && (
        <div className="glass-card" style={{ borderLeft: '4px solid var(--color-gold)', backgroundColor: 'rgba(212, 175, 55, 0.03)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Sparkles size={16} color="var(--color-gold)" />
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-gold)' }}>Cashius Rebalance Advice</h4>
          </div>
          
          {data.recommendations.map((rec, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '11px', lineHeight: '1.4', color: 'var(--color-text-primary)' }}>
                {rec.message}
              </p>
              <button 
                onClick={() => {
                  if (rec.action.toLowerCase().includes('sip')) {
                    setSelectedFund(INDIAN_FUNDS[0]);
                    setShowSipModal(true);
                  } else {
                    alert('Redirecting to debt reallocation products.');
                  }
                }}
                className="btn-secondary" 
                style={{ alignSelf: 'flex-start', padding: '6px 10px', fontSize: '11px', fontWeight: '700' }}
              >
                {rec.action}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Holdings List table */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Holdings</h3>
          <button 
            onClick={() => setShowSipModal(true)}
            className="btn-primary" 
            style={{ width: 'auto', padding: '6px 12px', fontSize: '11px', textTransform: 'none', borderRadius: '6px' }}
          >
            + Start SIP
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {data.holdings.map((h, i) => (
            <div 
              key={h.id || i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingBottom: '10px',
                borderBottom: i < data.holdings.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
              }}
            >
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'white', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {h.assetName}
                </h4>
                <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  <span style={{
                    color: COLORS[h.assetClass] || 'white',
                    fontWeight: '700'
                  }}>
                    {h.assetClass}
                  </span>
                  <span>•</span>
                  <span>Units: {h.units}</span>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'white' }}>
                  {renderAmount(h.currentValue)}
                </span>
                <div style={{ fontSize: '10px', color: 'var(--color-success)', fontWeight: '600', marginTop: '2px' }}>
                  +12.8% Returns
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SIP SETUP MODAL DIALOG */}
      {showSipModal && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 22, 40, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 180,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '340px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', fontFamily: 'var(--font-title)' }}>
              Configure Systematic SIP
            </h3>
            
            {sipSuccessMsg ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle size={44} color="var(--color-success)" style={{ margin: '0 auto 12px auto' }} />
                <p style={{ fontSize: '13px', color: 'white', fontWeight: '600' }}>{sipSuccessMsg}</p>
              </div>
            ) : (
              <div>
                <div className="form-group">
                  <label className="form-label">Select Wealth Instrument</label>
                  <select 
                    className="form-input"
                    value={selectedFund.name}
                    onChange={(e) => {
                      const fund = INDIAN_FUNDS.find(f => f.name === e.target.value);
                      setSelectedFund(fund);
                    }}
                    style={{ backgroundColor: 'var(--color-navy-dark)' }}
                  >
                    {INDIAN_FUNDS.map((fund, index) => (
                      <option key={index} value={fund.name}>{fund.name} ({fund.expectedReturn})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Monthly SIP Amount</label>
                    <span style={{ fontSize: '13px', color: 'var(--color-gold)', fontWeight: '700' }}>
                      ₹{sipAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <input 
                    type="range" 
                    min="1000" 
                    max="50000" 
                    step="1000" 
                    value={sipAmount}
                    onChange={e => setSipAmount(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: 'var(--color-gold)' }}
                  />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    <span>₹1,000</span>
                    <span>₹50,000</span>
                  </div>
                </div>

                {/* Cashius recommendation in modal */}
                <div style={{ 
                  backgroundColor: 'rgba(212, 175, 55, 0.06)', 
                  border: '1px solid rgba(212, 175, 55, 0.15)',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  lineHeight: '1.4',
                  marginBottom: '20px'
                }}>
                  💡 **Cashius says:** "Based on your income, a ₹{sipAmount.toLocaleString('en-IN')}/month contribution fits comfortably into your budget, leaving you with healthy liquid cushions."
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setShowSipModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button onClick={handleSetupSip} className="btn-primary" style={{ flex: 1 }}>
                    Confirm SIP
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
