import React, { useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { TrendingUp, Award, Newspaper, BarChart2 } from 'lucide-react';

export default function MarketInsights() {
  const { marketNews, fetchMarketNews, loading, user } = useContext(AppContext);

  useEffect(() => {
    fetchMarketNews();
  }, [fetchMarketNews]);

  if (loading && !marketNews) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'center' }}>
        <div className="skeleton skeleton-card" style={{ height: '80px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '300px' }}></div>
      </div>
    );
  }

  const data = marketNews || {
    marketTrends: {
      nifty: '24,120 (+0.45%)',
      sensex: '79,230 (+0.38%)',
      gold10g: '₹72,400 (+1.2%)',
      inrUsd: '83.45 (-0.08%)'
    },
    news: [
      { id: 1, title: 'Central Bank Keeps Repo Rate Unchanged at 6.5%', summary: 'The central bank holds repo rates steady. Fixed deposit yields are expected to consolidate, creating a favorable window for lock-in deposits.', relevance: 'Conservative & Moderate Profiles', impact: 'Positive for Debt holdings', date: 'June 16, 2026' },
      { id: 2, title: 'Nifty 50 Index Reaches Historic Peak of 24,100', summary: 'Indian indices climb to record highs driven by strong corporate earnings and foreign investor inflows. Volatility may rise.', relevance: 'Aggressive & Moderate Profiles', impact: 'High Equity Portfolio returns', date: 'June 15, 2026' },
      { id: 3, title: 'Gold Rates Edge Up Amid Safe-Haven Buying', summary: 'Gold prices rise 1.8% in domestic markets. Sovereign Gold Bonds offer capital gains exemption on maturity.', relevance: 'All Profiles', impact: 'Favorable hedge against equity dips', date: 'June 14, 2026' }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Market Insights</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Personalized news feed & Indian index quotes</p>
        </div>
      </div>

      {/* Index Ticker Grid */}
      <div className="glass-card" style={{ padding: '14px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BarChart2 size={16} color="var(--color-gold)" /> Live Indian Market Rates
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
          <div style={{ backgroundColor: 'var(--color-navy-dark)', padding: '10px', borderRadius: '8px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Nifty 50</span>
            <div style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: '700', marginTop: '2px' }}>
              {data.marketTrends.nifty}
            </div>
          </div>
          
          <div style={{ backgroundColor: 'var(--color-navy-dark)', padding: '10px', borderRadius: '8px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>BSE Sensex</span>
            <div style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: '700', marginTop: '2px' }}>
              {data.marketTrends.sensex}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-navy-dark)', padding: '10px', borderRadius: '8px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Gold (24K / 10g)</span>
            <div style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: '700', marginTop: '2px' }}>
              {data.marketTrends.gold10g}
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-navy-dark)', padding: '10px', borderRadius: '8px' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>USD / INR</span>
            <div style={{ fontSize: '13px', color: 'white', fontWeight: '700', marginTop: '2px' }}>
              {data.marketTrends.inrUsd}
            </div>
          </div>
        </div>
      </div>

      {/* News Feeds */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Newspaper size={16} color="var(--color-gold)" /> Curated Market News
        </h3>

        {data.news.map((item) => (
          <div 
            key={item.id} 
            className="glass-card" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px',
              borderLeft: item.relevance.toLowerCase().includes(user?.riskProfile?.toLowerCase()) ? '3px solid var(--color-gold)' : '1px solid rgba(212,175,55,0.15)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '9px', color: 'var(--color-gold)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {item.relevance}
              </span>
              <span style={{ fontSize: '9px', color: 'var(--color-text-muted)' }}>{item.date}</span>
            </div>

            <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'white', lineHeight: '1.4' }}>
              {item.title}
            </h4>
            
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
              {item.summary}
            </p>

            <div style={{ 
              backgroundColor: 'rgba(255,255,255,0.03)', 
              borderRadius: '6px', 
              padding: '6px 10px', 
              fontSize: '10px', 
              fontWeight: '600', 
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '4px'
            }}>
              <TrendingUp size={12} /> Impact: {item.impact}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
