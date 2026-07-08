import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';

const RISK_QUESTIONS = [
  {
    id: 1,
    question: "What is your current age category?",
    options: [
      { text: "Over 65 years", score: 1 },
      { text: "51 to 65 years", score: 2 },
      { text: "35 to 50 years", score: 3 },
      { text: "Under 35 years", score: 4 }
    ]
  },
  {
    id: 2,
    question: "How would you describe your investment experience?",
    options: [
      { text: "Minimal - I have never invested before", score: 1 },
      { text: "Basic - I have put money in Fixed Deposits & Gold", score: 2 },
      { text: "Good - I invest regularly in Mutual Funds", score: 3 },
      { text: "Advanced - I trade Stocks, ETFs, & F&O directly", score: 4 }
    ]
  },
  {
    id: 3,
    question: "How stable is your current household income?",
    options: [
      { text: "Fluctuating - Retired or freelance commissions", score: 1 },
      { text: "Variable - Small business owner", score: 2 },
      { text: "Stable - Salaried job at private company", score: 3 },
      { text: "Highly Secure - Salaried government or large MNC role", score: 4 }
    ]
  },
  {
    id: 4,
    question: "What is the primary objective for your wealth?",
    options: [
      { text: "Capital Preservation - Avoid any losses at all costs", score: 1 },
      { text: "Regular Cash Flow - Generate reliable monthly interest", score: 2 },
      { text: "Balanced - Moderate growth with controlled downside", score: 3 },
      { text: "Capital Growth - Maximize long-term equity returns", score: 4 }
    ]
  },
  {
    id: 5,
    question: "What is your primary investment time horizon?",
    options: [
      { text: "Short-term: Less than 3 years", score: 1 },
      { text: "Medium-term: 3 to 7 years", score: 2 },
      { text: "Long-term: 7 to 15 years", score: 3 },
      { text: "Ultra long-term: More than 15 years", score: 4 }
    ]
  },
  {
    id: 6,
    question: "If your portfolio fell 20% in a month due to market volatility, you would:",
    options: [
      { text: "Sell everything immediately to prevent further risk", score: 1 },
      { text: "Withdraw half of the funds and wait in cash", score: 2 },
      { text: "Do nothing and patiently wait for market recovery", score: 3 },
      { text: "Buy more assets at discounted prices to average down", score: 4 }
    ]
  },
  {
    id: 7,
    question: "What percentage of monthly savings can you dedicate to equities?",
    options: [
      { text: "Under 10% - I prefer safe fixed assets", score: 1 },
      { text: "10% to 30% - Moderate equity exposure", score: 2 },
      { text: "31% to 60% - High equity exposure", score: 3 },
      { text: "Above 60% - Aggressive wealth building", score: 4 }
    ]
  },
  {
    id: 8,
    question: "Which return/volatility combination are you most comfortable with?",
    options: [
      { text: "Max gain: 6%, Max potential drop: 0% (e.g. FD)", score: 1 },
      { text: "Max gain: 11%, Max potential drop: 6% (Conservative)", score: 2 },
      { text: "Max gain: 18%, Max potential drop: 12% (Balanced)", score: 3 },
      { text: "Max gain: 32%, Max potential drop: 25% (Aggressive)", score: 4 }
    ]
  }
];

export default function Onboarding() {
  const { submitOnboarding, user } = useContext(AppContext);
  const [currentStep, setCurrentStep] = useState(-1); // -1 = Welcome screen
  const [answers, setAnswers] = useState([]);
  const [calculating, setCalculating] = useState(false);
  const [riskResult, setRiskResult] = useState('');

  const handleStart = () => {
    setCurrentStep(0);
    setAnswers([]);
  };

  const handleSelectOption = async (score) => {
    const nextAnswers = [...answers, score];
    setAnswers(nextAnswers);

    if (currentStep < RISK_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last question completed - calculate risk profile
      setCalculating(true);
      const isSuccess = await submitOnboarding(nextAnswers);
      setCalculating(false);
      
      if (isSuccess) {
        // Calculate result locally for display
        const total = nextAnswers.reduce((sum, s) => sum + s, 0);
        let profile = 'Moderate';
        if (total <= 14) profile = 'Conservative';
        else if (total >= 24) profile = 'Aggressive';
        setRiskResult(profile);
        setCurrentStep(RISK_QUESTIONS.length); // Show results screen
      }
    }
  };

  if (currentStep === -1) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '10px 0' }}>
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <div className="avatar-container animate-float">
            <div className="avatar-halo">
              <div className="avatar-portrait" style={{ width: '120px', height: '120px' }}>
                <span className="avatar-face">👩‍💼</span>
              </div>
            </div>
          </div>
          
          <h1 style={{ fontSize: '32px', marginBottom: '12px', letterSpacing: '-0.5px' }}>
            Meet <span className="gold-text-gradient">Cashius</span>
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '15px', lineHeight: '1.6', padding: '0 10px' }}>
            Your personal AI Wealth Advisor, backed by private banking intelligence. Let's calibrate your customized wealth plan.
          </p>
        </div>

        <div className="glass-card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '24px' }}>🛡️</div>
            <div style={{ textAlign: 'left' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Custom Risk Calibration</h4>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>We formulate your risk tolerance based on financial behavior and horizon inputs.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <div style={{ fontSize: '24px' }}>📊</div>
            <div style={{ textAlign: 'left' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700' }}>SIP Allocation Advice</h4>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Get targeted recommendations regarding mutual fund portfolios.</p>
            </div>
          </div>

          <button onClick={handleStart} className="btn-primary" style={{ marginTop: '10px' }}>
            Start Risk Profiling
          </button>
        </div>
      </div>
    );
  }

  // Results Screen
  if (currentStep === RISK_QUESTIONS.length) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '20px 0' }}>
        <div style={{ textAlign: 'center', marginTop: '60px' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px', animation: 'float 3s ease-in-out infinite' }}>
            🏆
          </div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Analysis Complete</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Cashius has compiled your profiles.
          </p>

          <div className="glass-card" style={{ margin: '30px 0', border: '1px solid var(--color-gold)' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-muted)' }}>
              Allocated Risk Appetite
            </span>
            <h2 className="gold-text-gradient" style={{ fontSize: '36px', marginTop: '6px', fontFamily: 'var(--font-title)' }}>
              {riskResult}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '12px', lineHeight: '1.5' }}>
              {riskResult === 'Conservative' && 'Your priority is capital safety and inflation hedging. We will focus on Debt funds, Sovereign Gold, and Fixed Deposits.'}
              {riskResult === 'Moderate' && 'You strike a balance between equity growth and debt protection. We will structure a 50/50 portfolio layout.'}
              {riskResult === 'Aggressive' && 'You seek high capital returns and can handle market volatility. We will prioritize Equity SIPs and thematic allocations.'}
            </p>
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary"
          style={{ marginBottom: '20px' }}
        >
          Enter Dashboard
        </button>
      </div>
    );
  }

  const currentQ = RISK_QUESTIONS[currentStep];
  const progressPct = Math.round(((currentStep) / RISK_QUESTIONS.length) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '10px 0' }}>
      <div>
        {/* Progress header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
          <span>Risk Assessment</span>
          <span>Question {currentStep + 1} of {RISK_QUESTIONS.length}</span>
        </div>
        
        {/* Progress bar */}
        <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--color-navy-light)', borderRadius: '2px', marginBottom: '24px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: 'var(--color-gold)', transition: 'width 0.3s ease' }}></div>
        </div>

        {/* Question Panel */}
        <h2 style={{ fontSize: '20px', fontWeight: '600', lineHeight: '1.4', marginBottom: '24px' }}>
          {currentQ.question}
        </h2>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {currentQ.options.map((opt, idx) => (
            <button 
              key={idx}
              onClick={() => handleSelectOption(opt.score)}
              className="glass-card"
              style={{
                textAlign: 'left',
                padding: '16px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--color-text-primary)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-gold)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.15)'; }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '1.5px solid var(--color-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--color-gold)',
                flexShrink: 0
              }}>
                {String.fromCharCode(65 + idx)}
              </div>
              <span>{opt.text}</span>
            </button>
          ))}
        </div>
      </div>

      {calculating && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(10, 22, 40, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 150
        }}>
          <div className="speech-wave" style={{ height: '30px', marginBottom: '16px' }}>
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <span style={{ fontSize: '14px', color: 'var(--color-gold)', fontWeight: '600' }}>
            Cashius is calibrating...
          </span>
        </div>
      )}

      <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '11px', marginTop: '16px' }}>
        Secure Profiling • IDBI Bank wealth management system
      </div>
    </div>
  );
}
