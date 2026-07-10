import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  ShoppingBag, 
  Utensils, 
  Car, 
  FileText, 
  Clapperboard, 
  HelpCircle, 
  AlertTriangle, 
  Calendar 
} from 'lucide-react';

const COLORS = {
  Food: '#F87171',
  Transport: '#60A5FA',
  Entertainment: '#C084FC',
  Bills: '#F472B6',
  Shopping: '#FBBF24',
  Others: '#34D399'
};

const CATEGORY_ICONS = {
  Food: <Utensils size={16} />,
  Transport: <Car size={16} />,
  Entertainment: <Clapperboard size={16} />,
  Bills: <FileText size={16} />,
  Shopping: <ShoppingBag size={16} />,
  Others: <HelpCircle size={16} />
};

export default function SpendingAnalyzer() {
  const { spendingData, fetchSpending, loading, isBalanceHidden } = useContext(AppContext);
  const [filterPeriod, setFilterPeriod] = useState('June 2026');

  useEffect(() => {
    fetchSpending();
  }, [fetchSpending]);

  const renderAmount = (val) => {
    if (isBalanceHidden) return '••••';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  if (loading && !spendingData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'center' }}>
        <div className="skeleton skeleton-card" style={{ height: '200px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '180px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '300px' }}></div>
      </div>
    );
  }

  const data = spendingData || {
    categoryTotals: { Food: 4400, Transport: 5450, Entertainment: 800, Bills: 23000, Shopping: 24000, Others: 6000 },
    monthlyTotals: [
      { month: 'Jan', total: 19800 },
      { month: 'Feb', total: 27200 },
      { month: 'Mar', total: 33100 },
      { month: 'Apr', total: 27750 },
      { month: 'May', total: 32350 },
      { month: 'Jun', total: 63650 }
    ],
    budgetComparison: {
      Food: { budget: 6000, actual: 4400, pct: 73, isOver: false },
      Transport: { budget: 8000, actual: 5450, pct: 68, isOver: false },
      Entertainment: { budget: 3000, actual: 800, pct: 27, isOver: false },
      Bills: { budget: 15000, actual: 23000, pct: 153, isOver: true },
      Shopping: { budget: 10000, actual: 24000, pct: 240, isOver: true },
      Others: { budget: 10000, actual: 6000, pct: 60, isOver: false }
    },
    anomalies: [
      {
        id: 1,
        amount: 24000,
        category: 'Shopping',
        date: '2026-06-08',
        merchantName: 'Amazon India',
        reason: 'Shopping amount is unusually high for category (historical average is ₹3,000).'
      },
      {
        id: 2,
        amount: 8000,
        category: 'Bills',
        date: '2026-06-01',
        merchantName: 'Tata Power Electricity Bill',
        reason: 'Electricity bill is 35% higher than your historical average of ₹5,900.'
      }
    ],
    transactions: [
      { id: 1, amount: 1200, category: 'Food', date: '2026-06-15', merchantName: 'Zomato Delivery' },
      { id: 2, amount: 450, category: 'Transport', date: '2026-06-14', merchantName: 'Ola Cabs' },
      { id: 3, amount: 15000, category: 'Bills', date: '2026-06-10', merchantName: 'Credit Card Payment' },
      { id: 4, amount: 24000, category: 'Shopping', date: '2026-06-08', merchantName: 'Amazon India' },
      { id: 5, amount: 800, category: 'Entertainment', date: '2026-06-07', merchantName: 'Netflix India' }
    ]
  };

  // Convert categories to Pie values
  const donutData = Object.keys(data.categoryTotals).map(key => ({
    name: key,
    value: data.categoryTotals[key]
  })).filter(item => item.value > 0);

  const totalSpent = Object.values(data.categoryTotals).reduce((sum, v) => sum + v, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Spending Analyzer</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Real-time category audits & anomaly detection</p>
        </div>
        <div style={{ backgroundColor: 'var(--color-navy-light)', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid rgba(212,175,55,0.2)' }}>
          {filterPeriod}
        </div>
      </div>

      {/* Recharts Donut Pie Chart */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', alignSelf: 'flex-start', marginBottom: '10px' }}>Category Breakdown</h3>
        
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', height: '140px' }}>
          <div style={{ width: '50%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={54}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [renderAmount(value), 'Spent']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend Grid */}
          <div style={{ width: '50%', display: 'grid', gridTemplateColumns: '1fr', gap: '6px', fontSize: '11px' }}>
            {donutData.map((entry, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[entry.name] }}></span>
                  <span style={{ color: 'var(--color-text-muted)', fontWeight: '500' }}>{entry.name}</span>
                </div>
                <span style={{ fontWeight: '700' }}>
                  {Math.round((entry.value / totalSpent) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', height: '1px', backgroundColor: 'var(--color-navy-light)', margin: '12px 0' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '12px' }}>
          <span style={{ color: 'var(--color-text-muted)' }}>June Total Expenditure:</span>
          <span className="gold-text-gradient" style={{ fontWeight: '700', fontSize: '14px' }}>
            {renderAmount(totalSpent)}
          </span>
        </div>
      </div>

      {/* Anomaly Alerts Panel */}
      {data.anomalies.length > 0 && (
        <div className="glass-card" style={{ border: '1px solid rgba(239, 68, 68, 0.4)', backgroundColor: 'rgba(239, 68, 68, 0.03)', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={18} color="var(--color-danger)" />
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-danger)' }}>Anomalies Flagged by Cashius</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.anomalies.map(anomaly => (
              <div 
                key={anomaly.id} 
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.05)', 
                  borderLeft: '3px solid var(--color-danger)',
                  padding: '10px', 
                  borderRadius: '6px', 
                  fontSize: '11px' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--color-text-primary)' }}>{anomaly.merchantName}</span>
                  <span style={{ color: 'var(--color-danger)' }}>{renderAmount(anomaly.amount)}</span>
                </div>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.4' }}>{anomaly.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Expenses Chart */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Monthly Comparison (6 Months)</h3>
        
        <div style={{ width: '100%', height: '140px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthlyTotals}>
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
              <YAxis hide={true} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--color-navy-light)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '8px', fontSize: '11px' }}
                formatter={(value) => [renderAmount(value), 'Total Expense']}
              />
              <Bar dataKey="total" fill="var(--color-gold)" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Budget vs Actual Comparison list */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '14px' }}>Budget Tracking</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Object.keys(data.budgetComparison).map(cat => {
            const item = data.budgetComparison[cat];
            const progressColor = item.isOver ? 'var(--color-danger)' : item.pct > 80 ? 'var(--color-warning)' : 'var(--color-success)';
            
            return (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: COLORS[cat] }}></span>
                    <span style={{ fontWeight: '500' }}>{cat}</span>
                  </div>
                  <span style={{ color: item.isOver ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                    {renderAmount(item.actual)} / {renderAmount(item.budget)}
                  </span>
                </div>
                <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--color-navy-dark)', borderRadius: '2.5px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, item.pct)}%`, height: '100%', backgroundColor: progressColor, borderRadius: '2.5px' }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Transaction List */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '14px' }}>June Transaction Ledger</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {data.transactions.map((tx, idx) => (
            <div 
              key={tx.id || idx} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                paddingBottom: '10px',
                borderBottom: idx < data.transactions.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: COLORS[tx.category] ? `${COLORS[tx.category]}20` : 'var(--color-navy-light)',
                  color: COLORS[tx.category] || 'var(--color-text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {CATEGORY_ICONS[tx.category] || <HelpCircle size={16} />}
                </div>
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-primary)', maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.merchantName}
                  </h4>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Calendar size={10} /> {tx.date}
                  </span>
                </div>
              </div>
              
              <span style={{ 
                fontSize: '13px', 
                fontWeight: '700', 
                color: data.anomalies.some(an => an.id === tx.id) ? 'var(--color-danger)' : 'white' 
              }}>
                {renderAmount(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
