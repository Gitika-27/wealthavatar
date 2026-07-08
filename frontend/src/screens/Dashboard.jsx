import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Eye, 
  EyeOff, 
  TrendingUp, 
  MessageSquare, 
  Briefcase, 
  PlusCircle, 
  ChevronRight, 
  AlertCircle,
  Bell 
} from 'lucide-react';

// Mock chart data for different intervals
const PORTFOLIO_HISTORY = {
  '1W': [
    { name: 'Mon', value: 680000 },
    { name: 'Tue', value: 683200 },
    { name: 'Wed', value: 681500 },
    { name: 'Thu', value: 689000 },
    { name: 'Fri', value: 687400 },
    { name: 'Sat', value: 688000 },
    { name: 'Sun', value: 690000 }
  ],
  '1M': [
    { name: 'Wk 1', value: 672000 },
    { name: 'Wk 2', value: 685000 },
    { name: 'Wk 3', value: 678000 },
    { name: 'Wk 4', value: 690000 }
  ],
  '3M': [
    { name: 'Apr', value: 645000 },
    { name: 'May', value: 668000 },
    { name: 'Jun', value: 690000 }
  ],
  '1Y': [
    { name: 'Jun 25', value: 580000 },
    { name: 'Aug 25', value: 592000 },
    { name: 'Oct 25', value: 615000 },
    { name: 'Dec 25', value: 630000 },
    { name: 'Feb 26', value: 652000 },
    { name: 'Apr 26', value: 645000 },
    { name: 'Jun 26', value: 690000 }
  ]
};

export default function Dashboard() {
  const { 
    user, 
    dashboardData, 
    fetchDashboard, 
    isBalanceHidden, 
    toggleBalancePrivacy, 
    setActiveScreen,
    loading 
  } = useContext(AppContext);

  const [timeframe, setTimeframe] = useState('1M');

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Balance masking helper
  const renderBalance = (val) => {
    if (isBalanceHidden) return '••••••';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const getPercentageColor = (val) => {
    return val >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
  };

  if (loading && !dashboardData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'center' }}>
        <div className="skeleton skeleton-card" style={{ height: '180px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '250px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '120px' }}></div>
      </div>
    );
  }

  const data = dashboardData || {
    userName: user?.name || 'Customer',
    netWorth: 645000,
    netWorthMoM: 4.2,
    portfolioValue: 690000,
    topCategories: [
      { category: 'Shopping', amount: 24000 },
      { category: 'Bills', amount: 23000 },
      { category: 'Food', amount: 4400 }
    ],
    activeGoals: [
      { id: 1, name: 'Retirement', pct: 9, status: 'On Track' },
      { id: 2, name: 'Home Purchase', pct: 15, status: 'Behind' }
    ],
    aiInsight: "You saved 12% more than last month! However, your Shopping bill is high (₹24,000). Let's review targets.",
    aiNudge: "Shift ₹7,500 from your Shopping budget to correct your Home Purchase goal lag.",
    aiRebalanceTip: "SGB Gold Bonds are trading today. Rebalance Gold weights to 10% to lock-in hedge protection."
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Greetings Card */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            onClick={() => setActiveScreen('Chat')}
            className="avatar-portrait" 
            style={{ width: '48px', height: '48px', animation: 'none', cursor: 'pointer' }}
          >
            <span style={{ fontSize: '24px' }}>👩‍💼</span>
          </div>
          <div>
            <h3 style={{ fontSize: '13px', color: 'var(--color-text-muted)', fontWeight: '500' }}>Welcome back,</h3>
            <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{data.userName}</h2>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setActiveScreen('Notifications')}
            style={{ 
              backgroundColor: 'var(--color-navy-light)', 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-gold)',
              position: 'relative'
            }}
            title="Notifications"
          >
            <Bell size={18} />
            <span style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '8px',
              height: '8px',
              backgroundColor: 'var(--color-danger)',
              borderRadius: '50%',
              boxShadow: '0 0 4px var(--color-danger)'
            }}></span>
          </button>

          <button 
            onClick={toggleBalancePrivacy}
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
            {isBalanceHidden ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Net Worth Card */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(16, 31, 66, 0.9) 0%, rgba(10, 22, 40, 0.9) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow vector back */}
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          backgroundColor: 'rgba(212, 175, 55, 0.08)',
          filter: 'blur(20px)'
        }}></div>

        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)', fontWeight: '600' }}>
          Consolidated Net Worth
        </span>
        <h1 className="gold-text-gradient" style={{ fontSize: '32px', margin: '6px 0 10px 0', fontFamily: 'var(--font-title)' }}>
          {renderBalance(data.netWorth)}
        </h1>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <TrendingUp size={16} color="#10B981" />
            <span style={{ color: '#10B981', fontWeight: '700' }}>+{data.netWorthMoM}%</span>
            <span style={{ color: 'var(--color-text-muted)' }}>MoM Change</span>
          </div>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
            Liabilities: ₹45,000
          </span>
        </div>
      </div>

      {/* Recharts Portfolio Performance Line Chart */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Portfolio Performance</h3>
          <div style={{ display: 'flex', gap: '6px', backgroundColor: 'var(--color-navy-dark)', padding: '2px', borderRadius: '6px' }}>
            {['1W', '1M', '3M', '1Y'].map(tf => (
              <button 
                key={tf}
                onClick={() => setTimeframe(tf)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  backgroundColor: timeframe === tf ? 'var(--color-gold)' : 'transparent',
                  color: timeframe === tf ? '#0A1628' : 'var(--color-text-muted)'
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', height: '140px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={PORTFOLIO_HISTORY[timeframe]}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-gold)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--color-gold)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
              />
              <YAxis 
                hide={true} 
                domain={['dataMin - 10000', 'dataMax + 10000']} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--color-navy-light)', 
                  border: '1px solid rgba(212,175,55,0.3)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: 'white'
                }}
                formatter={(value) => [renderBalance(value), 'Value']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="var(--color-gold)" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cashius AI Advice Panel */}
      <div className="glass-card" style={{
        borderLeft: '4px solid var(--color-gold)',
        backgroundColor: 'rgba(212, 175, 55, 0.03)',
        padding: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '18px' }}>👩‍💼</span>
          <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-gold)' }}>Cashius AI Analysis</h4>
        </div>
        <p style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--color-text-primary)' }}>
          "{data.aiInsight}"
        </p>
        
        {data.aiNudge && (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start', marginTop: '10px', backgroundColor: 'rgba(245, 158, 11, 0.08)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
            <AlertCircle size={14} color="var(--color-warning)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: 'var(--color-warning)' }}>
              {data.aiNudge}
            </span>
          </div>
        )}
      </div>

      {/* Quick Action Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <button 
          onClick={() => setActiveScreen('Chat')}
          className="glass-card" 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 6px' }}
        >
          <MessageSquare size={18} color="var(--color-gold)" />
          <span style={{ fontSize: '10px', fontWeight: '600' }}>Chat Cashius</span>
        </button>

        <button 
          onClick={() => setActiveScreen('Portfolio')}
          className="glass-card" 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 6px' }}
        >
          <Briefcase size={18} color="var(--color-gold)" />
          <span style={{ fontSize: '10px', fontWeight: '600' }}>Portfolio</span>
        </button>

        <button 
          onClick={() => setActiveScreen('Goals')}
          className="glass-card" 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 6px' }}
        >
          <PlusCircle size={18} color="var(--color-gold)" />
          <span style={{ fontSize: '10px', fontWeight: '600' }}>Manage Goals</span>
        </button>
      </div>

      {/* Spending Progress Overview */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700' }}>Spending Consumption</h3>
          <button 
            onClick={() => setActiveScreen('Spending')}
            style={{ fontSize: '11px', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', fontWeight: '600', backgroundColor: 'transparent' }}
          >
            Details <ChevronRight size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.topCategories.map((cat, i) => {
            // budgets
            const budgets = { Shopping: 10000, Bills: 15000, Food: 6000 };
            const limit = budgets[cat.category] || 10000;
            const pct = Math.min(100, Math.round((cat.amount / limit) * 100));
            const progressColor = pct > 90 ? 'var(--color-danger)' : pct > 75 ? 'var(--color-warning)' : 'var(--color-gold)';
            
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '500' }}>{cat.category}</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    ₹{cat.amount.toLocaleString('en-IN')} / <span style={{ fontSize: '10px' }}>₹{limit.toLocaleString('en-IN')}</span>
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-navy-dark)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', backgroundColor: progressColor, borderRadius: '3px' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Goal Progress Rings */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '14px' }}>Goal Progress</h3>
        
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {data.activeGoals.map(goal => (
            <div 
              key={goal.id} 
              className="glass-card" 
              style={{ 
                flex: '0 0 130px', 
                padding: '12px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                backgroundColor: 'rgba(22, 42, 69, 0.4)'
              }}
            >
              {/* Circular Ring SVG */}
              <div style={{ position: 'relative', width: '56px', height: '56px', marginBottom: '8px' }}>
                <svg width="56" height="56" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--color-navy-dark)"
                    strokeWidth="3.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={goal.status === 'Behind' ? 'var(--color-warning)' : 'var(--color-success)'}
                    strokeWidth="3.5"
                    strokeDasharray={`${goal.pct}, 100`}
                  />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>
                  {goal.pct}%
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }}>
                {goal.name}
              </span>
              <span style={{ fontSize: '9px', color: goal.status === 'Behind' ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>
                {goal.status}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
