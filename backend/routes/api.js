const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('../config/db');
const { cache } = require('../config/redis');
const { authenticateToken, jwtSecret } = require('../middleware/auth');

// Import services
const { askCashius, getDashboardInsights } = require('../services/avatarAdvisor');
const { analyzeSpending } = require('../services/spendingAnalyzer');
const { calculateRiskProfile } = require('../services/riskProfiler');
const { analyzeGoal } = require('../services/goalTracker');
const { generateNudges } = require('../services/nudgeEngine');

// -------------------------------------------------------------------------
// AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------------------

/**
 * Register a new user
 */
router.post('/auth/register', async (req, res) => {
  const { name, email, password, monthlyIncome } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    // Check if user already exists
    const checkUser = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const income = parseFloat(monthlyIncome) || 80000;

    await db.execute(
      'INSERT INTO users (name, email, password_hash, risk_profile, monthly_income) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, 'Moderate', income]
    );

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ error: 'Failed to register user.' });
  }
});

/**
 * Login endpoint
 */
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const userRes = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userRes.rows[0];
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate Token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      jwtSecret,
      { expiresIn: '2h' }
    );

    // Initialize session active state in cache
    await cache.set(`session:${user.id}`, Date.now().toString(), 600);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        riskProfile: user.risk_profile,
        monthlyIncome: user.monthly_income
      }
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ error: 'Authentication failed.' });
  }
});

// -------------------------------------------------------------------------
// USER & ONBOARDING ENDPOINTS
// -------------------------------------------------------------------------

/**
 * Get profile information
 */
router.get('/user/profile', authenticateToken, async (req, res) => {
  try {
    const userRes = await db.query('SELECT id, name, email, risk_profile, monthly_income FROM users WHERE id = ?', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = userRes.rows[0];
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      riskProfile: user.risk_profile,
      monthlyIncome: user.monthly_income
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

/**
 * Process onboarding risk answers
 */
router.post('/user/onboard', authenticateToken, async (req, res) => {
  const { answers } = req.body; // Expecting array of 8 integers

  if (!answers || !Array.isArray(answers) || answers.length !== 8) {
    return res.status(400).json({ error: 'Answers array containing exactly 8 answers is required.' });
  }

  try {
    const result = await calculateRiskProfile(req.user.id, answers);
    res.json({
      message: 'Risk profiling completed successfully.',
      score: result.score,
      riskProfile: result.profile
    });
  } catch (error) {
    console.error('Onboarding Error:', error.message);
    res.status(500).json({ error: 'Failed to calculate risk profile.' });
  }
});

// -------------------------------------------------------------------------
// DASHBOARD ENDPOINTS
// -------------------------------------------------------------------------

/**
 * Dashboard aggregates
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Get user profile
    const userRes = await db.query('SELECT name, risk_profile, monthly_income, email FROM users WHERE id = ?', [userId]);
    const user = userRes.rows[0];

    // 2. Get Portfolio value
    const portfolioRes = await db.query('SELECT current_value FROM portfolios WHERE user_id = ?', [userId]);
    const totalPortfolio = portfolioRes.rows.reduce((sum, r) => sum + parseFloat(r.current_value), 0);

    // Mock liabilities (mortgage/credit card balance) to compute net worth
    const liabilities = 45000.00;
    const netWorth = Math.round(totalPortfolio - liabilities);
    
    // MoM change (e.g. +4.2% change mock)
    const netWorthMoM = 4.2;

    // 3. Spending Analyzer top categories (June 2026)
    const spendAnalysis = await analyzeSpending(userId);
    const sortedCategories = Object.keys(spendAnalysis.categoryTotals)
      .map(key => ({ category: key, amount: spendAnalysis.categoryTotals[key] }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    // 4. Goals summary
    const goalsRes = await db.query('SELECT * FROM goals WHERE user_id = ?', [userId]);
    const goals = goalsRes.rows.map(g => {
      const stats = analyzeGoal(g);
      return {
        id: g.id,
        name: g.name,
        type: g.type,
        current: g.current_amount,
        target: g.target_amount,
        pct: stats.progressPercentage,
        status: stats.healthStatus
      };
    });

    // 5. Query Claude API via avatarAdvisor for insights
    const txRes = await db.query('SELECT * FROM transactions WHERE user_id = ?', [userId]);
    const holdingsRes = await db.query('SELECT * FROM portfolios WHERE user_id = ?', [userId]);
    
    const userContext = {
      name: user.name,
      email: user.email,
      riskProfile: user.risk_profile,
      monthlyIncome: user.monthly_income,
      transactions: txRes.rows,
      portfolio: holdingsRes.rows,
      goals: goalsRes.rows
    };

    const aiInsights = await getDashboardInsights(userContext);

    res.json({
      userName: user.name,
      netWorth,
      netWorthMoM,
      portfolioValue: totalPortfolio,
      topCategories: sortedCategories,
      activeGoals: goals,
      aiInsight: aiInsights.insight,
      aiNudge: aiInsights.nudge,
      aiRebalanceTip: aiInsights.rebalanceTip
    });
  } catch (error) {
    console.error('Dashboard Endpoint Error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve dashboard data.' });
  }
});

// -------------------------------------------------------------------------
// SPENDING ANALYZER ENDPOINTS
// -------------------------------------------------------------------------

/**
 * Spending overview data
 */
router.get('/spending', authenticateToken, async (req, res) => {
  try {
    const analysis = await analyzeSpending(req.user.id);
    
    // Fetch individual transaction list for rendering
    const txRes = await db.query(
      'SELECT id, amount, category, date, merchant_name as merchantName FROM transactions WHERE user_id = ? ORDER BY date DESC', 
      [req.user.id]
    );

    res.json({
      categoryTotals: analysis.categoryTotals,
      monthlyTotals: analysis.monthlyTotals,
      budgetComparison: analysis.budgetComparison,
      anomalies: analysis.anomalies,
      transactions: txRes.rows
    });
  } catch (error) {
    console.error('Spending Endpoint Error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve spending logs.' });
  }
});

// -------------------------------------------------------------------------
// PORTFOLIO ENDPOINTS
// -------------------------------------------------------------------------

/**
 * Portfolio holdings and recommendations
 */
router.get('/portfolio', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const userRes = await db.query('SELECT risk_profile FROM users WHERE id = ?', [userId]);
    const riskProfile = userRes.rows[0].risk_profile;

    const holdingsRes = await db.query(
      'SELECT id, asset_class as assetClass, asset_name as assetName, units, purchase_price as purchasePrice, current_value as currentValue FROM portfolios WHERE user_id = ?', 
      [userId]
    );
    const holdings = holdingsRes.rows;

    const totalValue = holdings.reduce((sum, h) => sum + parseFloat(h.currentValue), 0);
    const totalCost = holdings.reduce((sum, h) => sum + (parseFloat(h.units) * parseFloat(h.purchasePrice)), 0);
    const todayGainLoss = totalValue - totalCost;
    const gainLossPercentage = totalCost > 0 ? ((todayGainLoss / totalCost) * 100).toFixed(2) : 0;

    // Asset allocation grouping
    const allocation = { Equity: 0, Debt: 0, Gold: 0, Cash: 0 };
    holdings.forEach(h => {
      if (allocation[h.assetClass] !== undefined) {
        allocation[h.assetClass] += parseFloat(h.currentValue);
      }
    });

    const allocationChart = Object.keys(allocation).map(key => ({
      name: key,
      value: Math.round(allocation[key]),
      percentage: totalValue > 0 ? Math.round((allocation[key] / totalValue) * 100) : 0
    }));

    // Rebalancing Suggestions
    const recommendations = [];
    const equityPct = (allocation.Equity / totalValue) * 100;
    
    if (riskProfile === 'Moderate') {
      if (equityPct > 60) {
        recommendations.push({
          type: 'Rebalance',
          assetClass: 'Equity',
          message: `Your Equity Allocation (${Math.round(equityPct)}%) exceeds Moderate guidelines (50%). Consider shifting ₹${Math.round(totalValue * (equityPct - 50) / 100).toLocaleString('en-IN')} into Debt or Sovereign Gold Bonds.`,
          action: 'Transfer to PPF / SGB'
        });
      } else if (equityPct < 40) {
        recommendations.push({
          type: 'Rebalance',
          assetClass: 'Equity',
          message: `Your Equity allocation is relatively low (${Math.round(equityPct)}%). Leverage SIP options in Nifty Index Mutual Funds to boost return potentials.`,
          action: 'Increase Mutual Fund SIP'
        });
      }
    } else if (riskProfile === 'Conservative' && equityPct > 40) {
      recommendations.push({
        type: 'Rebalance',
        assetClass: 'Equity',
        message: `Your high equity weight of ${Math.round(equityPct)}% poses volatility risk. Reallocate to fixed deposits or PPF for principal protection.`,
        action: 'Increase Fixed Deposit'
      });
    } else if (riskProfile === 'Aggressive' && equityPct < 60) {
      recommendations.push({
        type: 'Rebalance',
        assetClass: 'Equity',
        message: `Your portfolio holds only ${Math.round(equityPct)}% equities. Aggressive growth profiles benefit from up to 70% equities. Enhance SIPs in mid-cap options.`,
        action: 'Start Equity SIP'
      });
    }

    if (allocation.Cash > (totalValue * 0.20)) {
      recommendations.push({
        type: 'Optimizer',
        assetClass: 'Cash',
        message: `Idle funds of ₹${allocation.Cash.toLocaleString('en-IN')} are losing value to inflation. Secure 3-month liquid reserves and route the remainder into Arbitrage Mutual Funds.`,
        action: 'Deploy Idle Funds'
      });
    }

    res.json({
      totalValue,
      todayGainLoss,
      gainLossPercentage: parseFloat(gainLossPercentage),
      holdings,
      allocation: allocationChart,
      recommendations,
      riskProfile
    });
  } catch (error) {
    console.error('Portfolio Endpoint Error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve portfolio assets.' });
  }
});

/**
 * Configure/Alter SIP (Systematic Investment Plan)
 */
router.post('/portfolio/sip', authenticateToken, async (req, res) => {
  const { amount, assetName, frequency } = req.body;
  if (!amount || !assetName) {
    return res.status(400).json({ error: 'SIP amount and Asset name are required.' });
  }

  try {
    // Add SIP purchase to portfolio
    const today = new Date().toISOString().split('T')[0];
    const checkHolding = await db.query(
      'SELECT * FROM portfolios WHERE user_id = ? AND asset_name = ? LIMIT 1',
      [req.user.id, assetName]
    );

    if (checkHolding.rows.length > 0) {
      // Modify holding
      const newUnits = parseFloat(checkHolding.rows[0].units) + (parseFloat(amount) / 100); // Simulated unit buy price
      const newVal = parseFloat(checkHolding.rows[0].current_value) + parseFloat(amount);
      await db.execute(
        'UPDATE portfolios SET units = ?, current_value = ?, last_updated = ? WHERE id = ?',
        [newUnits, newVal, today, checkHolding.rows[0].id]
      );
    } else {
      // Insert new
      await db.execute(
        'INSERT INTO portfolios (user_id, asset_class, asset_name, units, purchase_price, current_value, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, 'Equity', assetName, parseFloat(amount)/100, 100.00, parseFloat(amount), today]
      );
    }

    res.json({ message: `Systematic Investment Plan of ₹${amount}/month configured for ${assetName}.` });
  } catch (error) {
    console.error('SIP Setup Error:', error.message);
    res.status(500).json({ error: 'Failed to configure SIP.' });
  }
});

// -------------------------------------------------------------------------
// GOALS ENDPOINTS
// -------------------------------------------------------------------------

/**
 * Get goals with milestone predictions
 */
router.get('/goals', authenticateToken, async (req, res) => {
  try {
    const goalsRes = await db.query('SELECT * FROM goals WHERE user_id = ?', [req.user.id]);
    const goals = goalsRes.rows.map(g => analyzeGoal(g));
    res.json(goals);
  } catch (error) {
    console.error('Goals Retrieve Error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve goals.' });
  }
});

/**
 * Add a new financial goal
 */
router.post('/goals', authenticateToken, async (req, res) => {
  const { name, type, targetAmount, targetDate, monthlyContribution } = req.body;

  if (!name || !type || !targetAmount || !targetDate) {
    return res.status(400).json({ error: 'Goal name, type, target amount, and target date are required.' });
  }

  try {
    const target = parseFloat(targetAmount);
    const monthly = parseFloat(monthlyContribution) || 0;
    const current = 0; // Starts at 0
    const status = 'On Track';

    // Store in DB
    await db.execute(
      'INSERT INTO goals (user_id, name, type, target_amount, current_amount, target_date, monthly_contribution, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, name, type, target, current, targetDate, monthly, status]
    );

    res.status(201).json({ message: 'Goal created successfully!' });
  } catch (error) {
    console.error('Goal Creation Error:', error.message);
    res.status(500).json({ error: 'Failed to create goal.' });
  }
});

// -------------------------------------------------------------------------
// CHAT ENDPOINTS
// -------------------------------------------------------------------------

/**
 * Retrieve recent chat logs
 */
router.get('/chat/history', authenticateToken, async (req, res) => {
  try {
    const historyRes = await db.query(
      'SELECT sender, message, created_at as createdAt FROM conversations WHERE user_id = ? ORDER BY created_at ASC LIMIT 50',
      [req.user.id]
    );
    res.json(historyRes.rows);
  } catch (error) {
    console.error('Chat History Error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve chat history.' });
  }
});

/**
 * Post a prompt query to Cashius
 */
router.post('/chat', authenticateToken, async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message body cannot be empty.' });
  }

  const userId = req.user.id;

  try {
    // 1. Get user context
    const userRes = await db.query('SELECT name, email, risk_profile, monthly_income FROM users WHERE id = ?', [userId]);
    const user = userRes.rows[0];

    const txRes = await db.query('SELECT * FROM transactions WHERE user_id = ?', [userId]);
    const portfolioRes = await db.query('SELECT * FROM portfolios WHERE user_id = ?', [userId]);
    const goalsRes = await db.query('SELECT * FROM goals WHERE user_id = ?', [userId]);

    const userContext = {
      name: user.name,
      email: user.email,
      riskProfile: user.risk_profile,
      monthlyIncome: user.monthly_income,
      transactions: txRes.rows,
      portfolio: portfolioRes.rows,
      goals: goalsRes.rows
    };

    // 2. Fetch history
    const historyRes = await db.query(
      'SELECT sender, message FROM conversations WHERE user_id = ? ORDER BY created_at ASC LIMIT 10',
      [userId]
    );

    // Save user message to database
    await db.execute('INSERT INTO conversations (user_id, sender, message) VALUES (?, ?, ?)', [userId, 'user', message]);

    // 3. Query Cashius
    const answer = await askCashius(userContext, historyRes.rows, message);

    // Save advisor response to database
    await db.execute('INSERT INTO conversations (user_id, sender, message) VALUES (?, ?, ?)', [userId, 'advisor', answer]);

    res.json({ response: answer });
  } catch (error) {
    console.error('Chat Endpoint Error:', error.message);
    res.status(500).json({ error: 'Cashius is currently resolving market queries. Please try again.' });
  }
});

// -------------------------------------------------------------------------
// NOTIFICATIONS & MARKET ENDPOINTS
// -------------------------------------------------------------------------

/**
 * Get dynamic nudges and morning tip
 */
router.get('/nudges', authenticateToken, async (req, res) => {
  try {
    const result = await generateNudges(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Nudges Endpoint Error:', error.message);
    res.status(500).json({ error: 'Failed to build alerts.' });
  }
});

/**
 * Get personalized news feeds
 */
router.get('/market/news', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const userRes = await db.query('SELECT risk_profile FROM users WHERE id = ?', [userId]);
    const risk = userRes.rows[0].risk_profile;

    // Build curated news relative to user risk profile
    const news = [
      {
        id: 1,
        title: 'Policy Rate Holds Steady at 6.5%',
        summary: 'The central bank holds repo rates steady. Fixed deposit yields are expected to consolidate, creating a favorable window for lock-in deposits.',
        relevance: 'Conservative & Moderate Profiles',
        impact: 'Positive for Debt holdings',
        date: 'June 16, 2026'
      },
      {
        id: 2,
        title: 'Nifty 50 Index Reaches Historic Peak of 24,100',
        summary: 'Indian indices climb to record highs driven by strong corporate earnings and foreign investor inflows. Volatility may rise.',
        relevance: 'Aggressive & Moderate Profiles',
        impact: 'High Equity Portfolio returns',
        date: 'June 15, 2026'
      },
      {
        id: 3,
        title: 'Gold Rates Edge Up Amid Safe-Haven Buying',
        summary: 'Gold prices rise 1.8% in domestic markets. Sovereign Gold Bonds offer capital gains exemption on maturity.',
        relevance: 'All Profiles',
        impact: 'Favorable hedge against equity dips',
        date: 'June 14, 2026'
      }
    ];

    // Profile specific news insertion
    if (risk === 'Aggressive') {
      news.unshift({
        id: 4,
        title: 'SEBI Proposes New Regulations on Tech Mid-Caps',
        summary: 'New corporate audit standards for technology companies expected to improve transparency, making tech mutual funds highly viable.',
        relevance: 'Aggressive Profiles',
        impact: 'Strategic Equity buying window',
        date: 'June 17, 2026'
      });
    } else if (risk === 'Conservative') {
      news.unshift({
        id: 5,
        title: 'Tax-Free Infrastructure Bonds Yielding 7.2% Announced',
        summary: 'NHAI announces tax-free bond issue. Secure opportunity for low-volatility fixed interest income matching conservative goals.',
        relevance: 'Conservative Profiles',
        impact: 'Low-risk passive income generation',
        date: 'June 17, 2026'
      });
    }

    res.json({
      marketTrends: {
        nifty: '24,120 (+0.45%)',
        sensex: '79,230 (+0.38%)',
        gold10g: '₹72,400 (+1.2%)',
        inrUsd: '83.45 (-0.08%)'
      },
      news
    });
  } catch (error) {
    console.error('News Endpoint Error:', error.message);
    res.status(500).json({ error: 'Failed to load market news.' });
  }
});

module.exports = router;
