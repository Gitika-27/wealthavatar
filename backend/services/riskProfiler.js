/**
 * Risk Profiler Service
 * Evaluates declared questionnaire answers and actual portfolio metrics.
 */

const { db } = require('../config/db');

/**
 * Calculates a consolidated risk profile
 * @param {Array} answers - Array of 8 answers with values (usually 1 to 4)
 * @param {number} userId - The user ID
 */
async function calculateRiskProfile(userId, answers) {
  if (!answers || answers.length !== 8) {
    throw new Error('Risk questionnaire requires exactly 8 answers.');
  }

  // 1. Calculate score from questionnaire
  // Answers are expected to be numbers from 1 to 4
  const questionScore = answers.reduce((sum, ans) => sum + parseInt(ans, 10), 0);
  
  let riskProfile = 'Moderate';
  if (questionScore <= 14) {
    riskProfile = 'Conservative';
  } else if (questionScore >= 24) {
    riskProfile = 'Aggressive';
  }

  // 2. Behavioral overlay (analyze their asset allocation if they have one)
  const holdingsResult = await db.query(
    'SELECT * FROM portfolios WHERE user_id = ? OR user_id = $1', 
    [userId]
  );
  const holdings = holdingsResult.rows;

  if (holdings.length > 0) {
    const totalAssets = holdings.reduce((sum, h) => sum + h.current_value, 0);
    const equityAssets = holdings
      .filter(h => h.asset_class === 'Equity')
      .reduce((sum, h) => sum + h.current_value, 0);
    
    const equityRatio = equityAssets / totalAssets;

    // Behavioral validation:
    // If declared is Aggressive but they have <15% in Equity, they are behaviorally Moderate/Conservative.
    // If declared is Conservative but they have >60% in Equity, they are behaviorally Moderate.
    if (riskProfile === 'Aggressive' && equityRatio < 0.15) {
      riskProfile = 'Moderate';
    } else if (riskProfile === 'Conservative' && equityRatio > 0.60) {
      riskProfile = 'Moderate';
    }
  }

  // 3. Update the user's risk profile in the database
  const updateQuery = db.isSQLite()
    ? 'UPDATE users SET risk_profile = ? WHERE id = ?'
    : 'UPDATE users SET risk_profile = $1 WHERE id = $2';
  
  await db.execute(updateQuery, [riskProfile, userId]);

  return {
    score: questionScore,
    profile: riskProfile,
    behaviorMatched: true
  };
}

module.exports = {
  calculateRiskProfile
};
