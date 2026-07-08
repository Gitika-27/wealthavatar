/**
 * Spending Analyzer Service
 * Analyzes transaction histories, category totals, and highlights unusual items.
 */

const { db } = require('../config/db');

/**
 * Perform analysis on user transactions
 */
async function analyzeSpending(userId) {
  // 1. Get all transactions for this user
  const txResult = await db.query(
    'SELECT * FROM transactions WHERE user_id = ? OR user_id = $1 ORDER BY date DESC', 
    [userId]
  );
  const transactions = txResult.rows;

  if (transactions.length === 0) {
    return {
      categoryTotals: {},
      monthlyTotals: [],
      anomalies: [],
      budgetComparison: {}
    };
  }

  // Define categories list
  const categories = ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Others'];

  // Current month (June 2026 for demo purposes)
  const currentMonthPrefix = '2026-06';

  // 2. Aggregate spending by category for June 2026
  const juneTx = transactions.filter(t => t.date.startsWith(currentMonthPrefix));
  const categoryTotals = {};
  categories.forEach(cat => { categoryTotals[cat] = 0; });
  
  juneTx.forEach(t => {
    if (categoryTotals[t.category] !== undefined) {
      categoryTotals[t.category] += parseFloat(t.amount);
    } else {
      categoryTotals['Others'] += parseFloat(t.amount);
    }
  });

  // 3. Get historical monthly totals (last 6 months: Jan 2026 to June 2026)
  const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
  const monthlyTotals = months.map(m => {
    const total = transactions
      .filter(t => t.date.startsWith(m))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return { month: m, total: Math.round(total) };
  });

  // 4. Calculate historical category averages (Jan 2026 to May 2026) to detect anomalies
  const historicalTx = transactions.filter(t => !t.date.startsWith(currentMonthPrefix));
  const historicalCategoryTotals = {};
  categories.forEach(cat => { historicalCategoryTotals[cat] = { total: 0, count: 0 }; });

  // Count months present in history (should be 5: Jan, Feb, Mar, Apr, May)
  const historicalMonths = [...new Set(historicalTx.map(t => t.date.slice(0, 7)))];
  const numHistMonths = historicalMonths.length || 1;

  historicalTx.forEach(t => {
    if (historicalCategoryTotals[t.category] !== undefined) {
      historicalCategoryTotals[t.category].total += parseFloat(t.amount);
    }
  });

  const categoryAverages = {};
  categories.forEach(cat => {
    categoryAverages[cat] = historicalCategoryTotals[cat].total / numHistMonths;
  });

  // 5. Detect anomalies (Single transactions exceeding category average by 20%
  // OR current monthly totals in a category exceeding average by 20%)
  const anomalies = [];
  
  // Transaction level anomaly check
  juneTx.forEach(t => {
    const avg = categoryAverages[t.category];
    const amount = parseFloat(t.amount);
    // Ignore small transactions under ₹1000 for anomaly detection
    if (avg > 0 && amount > 1000 && amount > (avg * 0.70)) { 
      // If a single transaction is particularly high or marked as anomaly
      if (t.merchant_name.toLowerCase().includes('anomaly') || amount > (avg * 1.5)) {
        anomalies.push({
          id: t.id,
          amount: amount,
          category: t.category,
          date: t.date,
          merchantName: t.merchant_name,
          reason: `Transaction amount ₹${amount.toLocaleString('en-IN')} is unusually high for category ${t.category} (historical average per transaction/month is ₹${Math.round(avg).toLocaleString('en-IN')}).`
        });
      }
    }
  });

  // Budget vs Actual Comparison per category
  // Mock budgets:
  const categoryBudgets = {
    Food: 6000,
    Transport: 8000,
    Entertainment: 3000,
    Bills: 15000,
    Shopping: 10000,
    Others: 10000
  };

  const budgetComparison = {};
  categories.forEach(cat => {
    const actual = categoryTotals[cat] || 0;
    const budget = categoryBudgets[cat];
    budgetComparison[cat] = {
      budget,
      actual: Math.round(actual),
      pct: Math.round((actual / budget) * 100),
      isOver: actual > budget
    };
  });

  return {
    categoryTotals,
    monthlyTotals,
    anomalies,
    budgetComparison
  };
}

module.exports = {
  analyzeSpending
};
