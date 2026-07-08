/**
 * Nudge Engine Service
 * Generates dynamic alerts, morning tips, goal notifications, and rebalancing suggestions.
 */

const { db } = require('../config/db');
const { analyzeSpending } = require('./spendingAnalyzer');

// Curated daily wealth tips for Indian Banking Customers
const DUALITY_TIPS = [
  "Leverage Section 80C by investing in ELSS (Equity Linked Savings Scheme). It offers the shortest lock-in period of 3 years compared to PPF or FDs.",
  "Consider routing a portion of your cash savings into Liquid Mutual Funds or Sweep-in FDs. They offer higher interest rates while keeping liquidity intact.",
  "Ensure you have a Health Insurance policy separate from your corporate plan. Medical inflation in India is rising at 10-14% annually.",
  "Sovereign Gold Bonds (SGB) are a tax-efficient way to invest in gold, offering a 2.5% annual interest payout on the initial investment amount.",
  "The secret to building long-term wealth in volatile markets is maintaining your SIPs (Systematic Investment Plans) to gain from Rupee Cost Averaging.",
  "Review your asset allocation annually. A simple rule is to subtract your age from 100 to determine your equity percentage exposure.",
  "Create an Emergency Fund covering at least 6 months of basic living expenses. Park this in a separate bank account or liquid funds."
];

/**
 * Generate all nudges and messages for a specific user
 */
async function generateNudges(userId) {
  const nudges = [];

  // 1. Get Daily Tip
  const dayIndex = new Date().getDate() % DUALITY_TIPS.length;
  const dailyTip = DUALITY_TIPS[dayIndex];

  // 2. Fetch User & Data
  const userRes = await db.query('SELECT * FROM users WHERE id = ? OR id = $1', [userId]);
  if (userRes.rows.length === 0) return { dailyTip, nudges };
  const user = userRes.rows[0];

  // 3. Spend Limit Nudges (20% over average)
  try {
    const spendAnalysis = await analyzeSpending(userId);
    const budgetComparison = spendAnalysis.budgetComparison || {};
    
    Object.keys(budgetComparison).forEach(cat => {
      const actual = budgetComparison[cat].actual;
      const budget = budgetComparison[cat].budget;
      
      // Warning if actual exceeds 90% of budget, or is over budget
      if (actual > budget) {
        nudges.push({
          type: 'WARNING',
          category: 'Budget',
          title: `Overbudget Alert: ${cat}`,
          message: `Your spending in ${cat} has reached ₹${actual.toLocaleString('en-IN')}, exceeding your budget of ₹${budget.toLocaleString('en-IN')}!`
        });
      } else if (actual > (budget * 0.85)) {
        nudges.push({
          type: 'INFO',
          category: 'Budget',
          title: `Budget Limit Approaching: ${cat}`,
          message: `You have consumed ${budgetComparison[cat].pct}% of your ₹${budget.toLocaleString('en-IN')} monthly limit for ${cat}.`
        });
      }
    });

    // Anomaly warnings
    spendAnalysis.anomalies.forEach(anomaly => {
      nudges.push({
        type: 'CRITICAL',
        category: 'Anomaly',
        title: `Unusual Transaction in ${anomaly.category}`,
        message: `Cashius noticed a high transaction of ₹${anomaly.amount.toLocaleString('en-IN')} at ${anomaly.merchantName} on ${anomaly.date}.`
      });
    });

  } catch (err) {
    console.error('Nudge Engine Spending Check Failed:', err.message);
  }

  // 4. Portfolio Asset Rebalancing opportunities
  try {
    const holdingsRes = await db.query('SELECT * FROM portfolios WHERE user_id = ? OR user_id = $1', [userId]);
    const holdings = holdingsRes.rows;

    if (holdings.length > 0) {
      const totalPortfolio = holdings.reduce((sum, h) => sum + h.current_value, 0);
      const equity = holdings.filter(h => h.asset_class === 'Equity').reduce((sum, h) => sum + h.current_value, 0);
      const cash = holdings.filter(h => h.asset_class === 'Cash').reduce((sum, h) => sum + h.current_value, 0);
      
      const equityPct = (equity / totalPortfolio) * 100;
      const cashPct = (cash / totalPortfolio) * 100;

      // Rebalancing nudges based on risk profile
      if (user.risk_profile === 'Conservative' && equityPct > 45) {
        nudges.push({
          type: 'ACTION',
          category: 'Portfolio',
          title: 'High Equity Exposure',
          message: `Your equity weight (${Math.round(equityPct)}%) exceeds conservative guidelines (max 40%). Cashius advises lock-in rebalancing to PPF or FDs.`
        });
      } else if (user.risk_profile === 'Aggressive' && equityPct < 55) {
        nudges.push({
          type: 'ACTION',
          category: 'Portfolio',
          title: 'Under-allocated Equities',
          message: `Your portfolio holds only ${Math.round(equityPct)}% in equity. For an Aggressive profile, Cashius recommends increasing equity SIP allocations.`
        });
      }

      if (cashPct > 25) {
        nudges.push({
          type: 'INFO',
          category: 'Portfolio',
          title: 'Idle Cash Alert',
          message: `You hold ${Math.round(cashPct)}% of your portfolio in cash. Move ₹${Math.round(totalPortfolio * (cashPct - 10) / 100).toLocaleString('en-IN')} into low-risk arbitrage mutual funds.`
        });
      }
    }
  } catch (err) {
    console.error('Nudge Engine Portfolio Check Failed:', err.message);
  }

  // 5. Goal Milestone Celebrations
  try {
    const goalsRes = await db.query('SELECT * FROM goals WHERE user_id = ? OR user_id = $1', [userId]);
    const goals = goalsRes.rows;

    goals.forEach(goal => {
      const current = parseFloat(goal.current_amount);
      const target = parseFloat(goal.target_amount);
      const progress = (current / target) * 100;

      if (progress >= 100) {
        nudges.push({
          type: 'CELEBRATION',
          category: 'Goal',
          title: `Goal Achieved! 🎉`,
          message: `Congratulations! You have successfully completed your goal "${goal.name}". Great job!`
        });
      } else if (progress >= 90) {
        nudges.push({
          type: 'CELEBRATION',
          category: 'Goal',
          title: 'Almost There!',
          message: `You are 90% of the way to achieving your "${goal.name}" goal. One final push!`
        });
      } else if (progress >= 50 && progress < 55) {
        // Just crossed half way
        nudges.push({
          type: 'CELEBRATION',
          category: 'Goal',
          title: 'Halfway Milestone reached!',
          message: `Awesome! You are 50% of the way to your "${goal.name}" goal.`
        });
      }

      if (goal.status === 'Behind') {
        nudges.push({
          type: 'WARNING',
          category: 'Goal',
          title: `Goal Status: Behind (${goal.name})`,
          message: `Your savings rate for "${goal.name}" is falling behind schedule. Review Cashius's plan to adjust monthly contributions.`
        });
      }
    });
  } catch (err) {
    console.error('Nudge Engine Goals Check Failed:', err.message);
  }

  return {
    dailyTip,
    nudges
  };
}

module.exports = {
  generateNudges
};
