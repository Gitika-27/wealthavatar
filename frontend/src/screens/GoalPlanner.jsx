import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import confetti from 'canvas-confetti';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  PlusCircle, 
  ArrowRight, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const GOAL_TYPES = [
  { type: 'Retirement', icon: '👴', defaultRate: '12% p.a. (Equity-led)' },
  { type: 'Home Purchase', icon: '🏠', defaultRate: '8% p.a. (Balanced)' },
  { type: 'Education', icon: '🎓', defaultRate: '10% p.a. (Growth-led)' },
  { type: 'Emergency Fund', icon: '🛡️', defaultRate: '6% p.a. (Liquid)' },
  { type: 'Custom Goal', icon: '💎', defaultRate: '8% p.a. (Balanced)' }
];

export default function GoalPlanner() {
  const { goalsData, fetchGoals, addGoal, loading, isBalanceHidden, user } = useContext(AppContext);
  const [showAddModal, setShowAddModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  
  // Wizard form state
  const [goalType, setGoalType] = useState('Home Purchase');
  const [goalName, setGoalName] = useState('');
  const [targetVal, setTargetVal] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState(10000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const renderAmount = (val) => {
    if (isBalanceHidden) return '••••••';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const getStatusColor = (status) => {
    if (status === 'On Track') return 'var(--color-success)';
    if (status === 'Behind') return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  // Dynamically calculate required monthly saving
  const calculateRequiredSavings = () => {
    const target = parseFloat(targetVal) || 0;
    if (target === 0 || !targetDate) return 0;
    
    const targetD = new Date(targetDate);
    const today = new Date();
    const months = (targetD.getFullYear() - today.getFullYear()) * 12 + (targetD.getMonth() - today.getMonth());
    const remainingMonths = Math.max(1, months);

    // Compound interest simplified:
    let annualRate = 0.08;
    if (goalType === 'Retirement') annualRate = 0.12;
    else if (goalType === 'Education') annualRate = 0.10;
    else if (goalType === 'Emergency Fund') annualRate = 0.06;

    const r = annualRate / 12;
    const annuityFactor = (Math.pow(1 + r, remainingMonths) - 1) / r;
    return Math.round(target / annuityFactor);
  };

  const handleCreateGoal = async () => {
    setIsSubmitting(true);
    const success = await addGoal(
      goalName || `${goalType} Goal`,
      goalType,
      parseFloat(targetVal),
      targetDate,
      monthlyContribution
    );
    setIsSubmitting(false);

    if (success) {
      // Wow effect: confetti
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Clear wizard
      setGoalName('');
      setTargetVal('');
      setTargetDate('');
      setMonthlyContribution(10000);
      setWizardStep(1);
      setShowAddModal(false);
    } else {
      alert('Failed to register goal. Check formatting.');
    }
  };

  if (loading && goalsData.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'center' }}>
        <div className="skeleton skeleton-card" style={{ height: '150px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '150px' }}></div>
        <div className="skeleton skeleton-card" style={{ height: '150px' }}></div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Goal Planner</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Track compound growth milestones</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary" 
          style={{ width: 'auto', padding: '8px 14px', fontSize: '12px', borderRadius: '20px' }}
        >
          + Add Goal
        </button>
      </div>

      {/* Empty State */}
      {goalsData.length === 0 && (
        <div className="glass-card empty-state" style={{ margin: '40px 0' }}>
          <div className="empty-state-avatar">🎯</div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>No Goals Configured</h3>
          <p className="empty-state-text">
            Hey {user?.name || 'there'}! I am Cashius. Setting up goals helps me recommend portfolio allocations. Tap "Add Goal" to get started!
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
            Setup First Goal
          </button>
        </div>
      )}

      {/* Goal Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {goalsData.map(goal => (
          <div key={goal.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                  {goal.type}
                </span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginTop: '2px', color: 'white' }}>{goal.name}</h3>
              </div>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: '700', 
                color: getStatusColor(goal.healthStatus), 
                backgroundColor: `${getStatusColor(goal.healthStatus)}15`,
                padding: '4px 8px',
                borderRadius: '12px',
                border: `1px solid ${getStatusColor(goal.healthStatus)}25`
              }}>
                {goal.healthStatus}
              </span>
            </div>

            {/* Circular progress container */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
                <svg width="64" height="64" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--color-navy-dark)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={getStatusColor(goal.healthStatus)}
                    strokeWidth="3"
                    strokeDasharray={`${goal.progressPercentage}, 100`}
                  />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '12px', fontWeight: '700' }}>
                  {goal.progressPercentage}%
                </div>
              </div>

              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px', fontSize: '11px' }}>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Target:</span>
                  <div style={{ color: 'white', fontWeight: '700' }}>{renderAmount(goal.targetAmount)}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Accumulated:</span>
                  <div style={{ color: 'white', fontWeight: '700' }}>{renderAmount(goal.currentAmount)}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Monthly SIP:</span>
                  <div style={{ color: 'white', fontWeight: '700' }}>{renderAmount(goal.monthlyContribution)}/m</div>
                </div>
                <div>
                  <span style={{ color: 'var(--color-text-muted)' }}>Target Date:</span>
                  <div style={{ color: 'white', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Calendar size={11} /> {goal.targetDate}
                  </div>
                </div>
              </div>
            </div>

            {/* Cashius specific goal tip */}
            <div style={{ 
              backgroundColor: 'var(--color-navy-dark)', 
              borderRadius: '8px', 
              padding: '10px 12px', 
              fontSize: '11px', 
              lineHeight: '1.4',
              display: 'flex', 
              gap: '6px', 
              alignItems: 'flex-start'
            }}>
              <TrendingUp size={14} color="var(--color-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                {goal.healthStatus === 'On Track' ? (
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    **On Schedule:** Your current SIP of {renderAmount(goal.monthlyContribution)} is sufficient. Estimated completion is **{goal.targetDate}**.
                  </span>
                ) : (
                  <span style={{ color: 'var(--color-warning)' }}>
                    **Under-funded:** Cashius advises increasing monthly SIP to **{renderAmount(goal.requiredMonthly)}** to offset the milestone lag.
                  </span>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* GOAL PLANNING MULTI-STEP WIZARD */}
      {showAddModal && (
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
            
            {/* Step 1: Select Type */}
            {wizardStep === 1 && (
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', fontFamily: 'var(--font-title)' }}>
                  Step 1: Goal Category
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {GOAL_TYPES.map((g, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setGoalType(g.type);
                        setGoalName(`${g.type} Fund`);
                        setWizardStep(2);
                      }}
                      className="glass-card"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        backgroundColor: goalType === g.type ? 'rgba(212, 175, 55, 0.15)' : 'rgba(22, 42, 69, 0.4)',
                        borderColor: goalType === g.type ? 'var(--color-gold)' : 'rgba(212, 175, 55, 0.15)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>{g.icon}</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{g.type}</span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{g.defaultRate}</span>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="btn-secondary" 
                  style={{ marginTop: '16px' }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Step 2: Target amount and Date */}
            {wizardStep === 2 && (
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', fontFamily: 'var(--font-title)' }}>
                  Step 2: Valuation & Horizon
                </h3>

                <div className="form-group">
                  <label className="form-label">Goal Label</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={goalName} 
                    onChange={e => setGoalName(e.target.value)} 
                    placeholder="e.g. Higher Education or Home Buying"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Corpus Needed (₹)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={targetVal} 
                    onChange={e => setTargetVal(e.target.value)} 
                    placeholder="e.g. 5000000"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Target Completion Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={targetDate} 
                    onChange={e => setTargetDate(e.target.value)} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setWizardStep(1)} className="btn-secondary" style={{ flex: 1 }}>
                    Back
                  </button>
                  <button 
                    onClick={() => {
                      if (!targetVal || !targetDate) {
                        alert('Please enter target amount and completion date.');
                        return;
                      }
                      // Set default contribution to match required
                      setMonthlyContribution(calculateRequiredSavings());
                      setWizardStep(3);
                    }} 
                    className="btn-primary" 
                    style={{ flex: 1 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: SIP Settings & Save */}
            {wizardStep === 3 && (
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', fontFamily: 'var(--font-title)' }}>
                  Step 3: Setup Contribution
                </h3>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Proposed Monthly SIP</label>
                    <span style={{ fontSize: '13px', color: 'var(--color-gold)', fontWeight: '700' }}>
                      ₹{monthlyContribution.toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  <input 
                    type="range" 
                    min="1000" 
                    max="100000" 
                    step="1000" 
                    value={monthlyContribution}
                    onChange={e => setMonthlyContribution(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: 'var(--color-gold)' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    <span>₹1,000</span>
                    <span>₹1,00,000</span>
                  </div>
                </div>

                {/* Savings check block */}
                <div style={{ 
                  backgroundColor: 'rgba(212, 175, 55, 0.06)', 
                  border: '1px solid rgba(212, 175, 55, 0.15)',
                  padding: '10px', 
                  borderRadius: '8px', 
                  fontSize: '11px',
                  lineHeight: '1.4',
                  marginBottom: '20px'
                }}>
                  📈 **Required Contribution:** ₹{calculateRequiredSavings().toLocaleString('en-IN')}/month.
                  <br />
                  <br />
                  💡 **Cashius advises:** "Based on your income, you can comfortably save **₹15,000/month** toward this goal. Set your slider accordingly."
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => setWizardStep(2)} className="btn-secondary" style={{ flex: 1 }}>
                    Back
                  </button>
                  <button 
                    onClick={handleCreateGoal} 
                    className="btn-primary" 
                    style={{ flex: 1 }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Add Goal'}
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
