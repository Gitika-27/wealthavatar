/**
 * Goal Tracker Service
 * Tracks progress of financial goals and projects milestones using compounded growth.
 */

/**
 * Calculate goal statistics and milestone projections
 * @param {Object} goal - Goal record from database
 */
function analyzeGoal(goal) {
  const target = parseFloat(goal.target_amount);
  const current = parseFloat(goal.current_amount);
  const monthlyContribution = parseFloat(goal.monthly_contribution);
  
  // Calculate months remaining
  const targetDate = new Date(goal.target_date);
  const today = new Date();
  
  // Diff in months
  const yearsDiff = targetDate.getFullYear() - today.getFullYear();
  const monthsDiff = targetDate.getMonth() - today.getMonth();
  const totalMonths = (yearsDiff * 12) + monthsDiff;
  const remainingMonths = Math.max(1, totalMonths);

  // Set returns assumption based on goal type (Equity vs Debt mix)
  // Retirement: 12% p.a. (0.01 per month)
  // Home Purchase: 8% p.a. (0.00667 per month)
  // Education: 10% p.a. (0.00833 per month)
  // Emergency Fund: 6% p.a. (0.005 per month)
  // Default: 8%
  let annualRate = 0.08;
  if (goal.type === 'Retirement') annualRate = 0.12;
  else if (goal.type === 'Education') annualRate = 0.10;
  else if (goal.type === 'Emergency Fund') annualRate = 0.06;

  const monthlyRate = annualRate / 12;

  // Calculate required monthly contribution to reach goal with compound interest
  // Target = Current * (1 + r)^n + PMT * [ ((1 + r)^n - 1) / r ] * (1 + r)
  // Solve for PMT:
  const compoundFactor = Math.pow(1 + monthlyRate, remainingMonths);
  const futureValueOfCurrent = current * compoundFactor;
  const remainingTarget = Math.max(0, target - futureValueOfCurrent);
  
  let requiredMonthly = 0;
  if (monthlyRate === 0) {
    requiredMonthly = remainingTarget / remainingMonths;
  } else {
    // PMT formula for ordinary annuity / annuity due (we use ordinary annuity here)
    const annuityFactor = (Math.pow(1 + monthlyRate, remainingMonths) - 1) / monthlyRate;
    requiredMonthly = remainingTarget / annuityFactor;
  }

  requiredMonthly = Math.round(Math.max(0, requiredMonthly));

  // Determine Goal Health Status
  // On Track: Contribution is >= 90% of required monthly contribution
  // Behind: Contribution is between 50% and 90% of required
  // At Risk: Contribution is < 50% of required, or goal is past due and incomplete
  let healthStatus = 'On Track';
  if (current >= target) {
    healthStatus = 'Completed';
  } else if (remainingMonths <= 0) {
    healthStatus = 'Behind';
  } else {
    const contributionRatio = monthlyContribution / requiredMonthly;
    if (contributionRatio >= 0.95) {
      healthStatus = 'On Track';
    } else if (contributionRatio >= 0.70) {
      healthStatus = 'Behind';
    } else {
      healthStatus = 'At Risk';
    }
  }

  // Generate projections for 1Y, 3Y, 5Y, and Target Year
  const projections = [];
  const milestones = [12, 36, 60, remainingMonths];
  
  milestones.forEach(m => {
    if (m > remainingMonths) return; // Don't project past target date
    
    const termFactor = Math.pow(1 + monthlyRate, m);
    const growthCurrent = current * termFactor;
    const annuityFactor = (Math.pow(1 + monthlyRate, m) - 1) / monthlyRate;
    const growthContributions = monthlyContribution * annuityFactor;
    const projectedValue = Math.round(growthCurrent + growthContributions);

    let periodLabel = `${Math.round(m / 12)} Years`;
    if (m === remainingMonths) {
      periodLabel = 'Target Date';
    } else if (m === 12) {
      periodLabel = '1 Year';
    }

    projections.push({
      months: m,
      label: periodLabel,
      amount: projectedValue,
      percentage: Math.min(100, Math.round((projectedValue / target) * 100))
    });
  });

  return {
    id: goal.id,
    name: goal.name,
    type: goal.type,
    targetAmount: target,
    currentAmount: current,
    targetDate: goal.target_date,
    monthlyContribution,
    requiredMonthly,
    remainingMonths,
    healthStatus,
    progressPercentage: Math.min(100, Math.round((current / target) * 100)),
    projections
  };
}

module.exports = {
  analyzeGoal
};
