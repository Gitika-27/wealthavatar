/**
 * AI Advisory Engine for WealthAvatar (Cashius)
 */

const SYSTEM_PROMPT = `You are Cashius, an AI-powered personal wealth advisor for IDBI Bank. You have access to the customer's complete financial profile including their spending habits, investment portfolio, financial goals, and risk appetite. Always give specific, data-driven, personalized advice. Be warm, clear, and actionable. Never give generic financial advice. Always reference the customer's actual numbers and situation. 

Personality rules:
- Professional but warm, friendly, and approachable.
- Use simple, jargon-free language.
- Always quote figures in Indian Rupees (₹).
- Proactively highlight risk flags (e.g., spending anomalies, low emergency reserves, off-track goals) and opportunities (e.g., rebalancing, SIP adjustments).
- Do NOT use markdown formatting characters like double asterisks '**' for bolding, or hash symbols '###' for headers. Write in clean, structured, easy-to-read natural text. Use plain numbers (e.g. 1, 2, 3) or capital letters for sections instead of markdown list bullets. Keep responses highly precise, concise, and easy to understand.`;

/**
 * Call the Claude API with the provided prompt and context
 */
async function callClaudeAPI(systemPrompt, messages) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your-anthropic-api-key-here' || apiKey === 'your-anthropic-api-key') {
    throw new Error('Claude API key is not configured');
  }

  // Anthropic messages API configuration
  // Using global Node fetch
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Claude API request failed: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

/**
 * Call the Groq API with the provided prompt and context
 */
async function callGroqAPI(systemPrompt, messages, jsonMode = false) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === 'your-groq-api-key-here') {
    throw new Error('Groq API key is not configured');
  }

  const payload = {
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ],
    temperature: 0.2
  };

  if (jsonMode) {
    payload.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq API request failed: ${response.status} - ${errorBody}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Unified AI advisor caller that prefers Groq if configured, and falls back to Claude.
 */
async function callAI(systemPrompt, messages, jsonMode = false) {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your-groq-api-key-here') {
    try {
      return await callGroqAPI(systemPrompt, messages, jsonMode);
    } catch (groqError) {
      console.warn('Groq API call failed, attempting Claude fallback:', groqError.message);
      if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-anthropic-api-key-here' && process.env.ANTHROPIC_API_KEY !== 'your-anthropic-api-key') {
        return await callClaudeAPI(systemPrompt, messages);
      }
      throw groqError;
    }
  }

  return await callClaudeAPI(systemPrompt, messages);
}

/**
 * Generates local fallback advice when Claude is not configured
 */
function getLocalFallbackAdvice(userContext, customQuery = null) {
  const { name, riskProfile, monthlyIncome, transactions, portfolio, goals } = userContext;
  
  // Basic aggregates
  const totalHoldings = portfolio.reduce((acc, h) => acc + h.current_value, 0);
  const monthlyExpenses = transactions
    .filter(t => t.date.startsWith('2026-06'))
    .reduce((acc, t) => acc + t.amount, 0);
  
  const savings = Math.max(0, monthlyIncome - monthlyExpenses);
  const savingsRate = Math.round((savings / monthlyIncome) * 100);

  // Asset allocation
  const allocation = { Equity: 0, Debt: 0, Gold: 0, Cash: 0 };
  portfolio.forEach(h => {
    if (allocation[h.asset_class] !== undefined) {
      allocation[h.asset_class] += h.current_value;
    }
  });

  const equityPct = Math.round((allocation.Equity / totalHoldings) * 100);
  const debtPct = Math.round((allocation.Debt / totalHoldings) * 100);
  const goldPct = Math.round((allocation.Gold / totalHoldings) * 100);
  const cashPct = Math.round((allocation.Cash / totalHoldings) * 100);

  // Anomaly & Goals detection
  const electricityAnomaly = transactions.find(t => t.merchant_name.includes('Electricity') && t.merchant_name.includes('Anomaly'));
  const shoppingAnomaly = transactions.find(t => t.merchant_name.includes('Amazon') && t.merchant_name.includes('Anomaly'));
  const behindGoals = goals.filter(g => g.status === 'Behind' || g.status === 'At Risk');

  // If there is a custom query, simulate Cashius chatbot
  if (customQuery) {
    const query = customQuery.toLowerCase();
    
    if (query.includes('hello') || query.includes('hi') || query.includes('hey')) {
      return `Namaste ${name}! I am Cashius, your personal wealth advisor. I see you have a net worth of ₹${totalHoldings.toLocaleString('en-IN')} and your risk appetite is ${riskProfile}. How can I assist you with your financial journey today? You can ask me about your investments, spending habits, or how to reach your active goals!`;
    }
    
    if (query.includes('portfolio') || query.includes('investment') || query.includes('asset')) {
      let advice = `Based on your profile, your asset allocation is ${equityPct}% Equity, ${debtPct}% Debt, ${goldPct}% Gold, and ${cashPct}% Cash. 
      
As a user with a ${riskProfile} risk profile, your optimal split should be around 50% Equity, 35% Debt, 10% Gold, and 5% Cash.

Here are my recommendations for your portfolio:
1. Equity Exposure: You have ₹${allocation.Equity.toLocaleString('en-IN')} in equities. Consider adding to your current SIPs like a diversified Nifty 50 Index Fund to leverage rupee-cost averaging.
2. Rebalancing: Your Cash allocation is ${cashPct}% (₹${allocation.Cash.toLocaleString('en-IN')}). We should deploy ₹30,000 of your cash into debt instruments or gold bonds to hedge inflation.
3. SIP Strategy: I recommend setting up a Systematic Investment Plan (SIP) in a diversified Nifty 50 Index Fund. Can I help you browse suitable SIP products?`;
      return advice;
    }

    if (query.includes('spend') || query.includes('expense') || query.includes('budget') || query.includes('money')) {
      return `Let's analyze your June spending, ${name}. Your total expenditures this month stand at ₹${monthlyExpenses.toLocaleString('en-IN')}, which is a ${savingsRate}% savings rate relative to your income of ₹${monthlyIncome.toLocaleString('en-IN')}.

I detected two areas of interest:
- Electricity Bill: Your bill of ₹8,000 on June 1st is 35% higher than your historical average of ₹5,900.
- Shopping: You made a high transaction of ₹24,000 at Amazon India. 

To offset this, try keeping your discretionary food delivery limits to ₹5,000 this month. You have currently spent ₹4,400. Let's keep it tight for the remaining weeks!`;
    }

    if (query.includes('goal') || query.includes('house') || query.includes('retirement') || query.includes('education')) {
      const gList = goals.map(g => `- ${g.name}: Progress is at ${Math.round((g.current_amount/g.target_amount)*100)}% (₹${g.current_amount.toLocaleString('en-IN')} of ₹${g.target_amount.toLocaleString('en-IN')}). Status: ${g.status}`).join('\n');
      let advice = `Here is your financial goals dashboard:
      
${gList}

Cashius Recommendation:
Your goal "${behindGoals[0] ? behindGoals[0].name : 'Home Purchase'}" is currently ${behindGoals[0] ? behindGoals[0].status : 'Behind'}. To meet your target date of 2030, you need to increase your monthly contribution from ₹25,000 to ₹32,500. I suggest shifting ₹7,500 from your monthly entertainment budget into this goal immediately.`;
      return advice;
    }

    if (query.includes('risk') || query.includes('profile')) {
      return `Your risk profile is currently evaluated as ${riskProfile}, calculated from your onboarding answers and balanced transaction behaviour. This means you can handle moderate volatility in search of long-term capital appreciation. If your investment horizon has changed, you can update this in the Profile Settings screen.`;
    }

    // Default chat responder
    return `I hear you, ${name}. Regarding your query: "${customQuery}", let me recommend checking your investment mix. You have ₹${totalHoldings.toLocaleString('en-IN')} total assets, with a strong ₹${allocation.Debt.toLocaleString('en-IN')} in stable debt products. Would you like to review how this matches your "${goals[0].name}" goal target? I can run a milestone projection for you.`;
  }

  // Default Dashboard Insight Card Advice
  return {
    insight: `You saved ${savingsRate}% of your income last month, Rajesh! Your largest discretionary expense was shopping (₹24,000). I recommend moving ₹10,000 of your idle cash balance into your Emergency Fund goal to secure a 6-month buffer.`,
    nudge: "You are ₹7,500/month behind on your Home Purchase goal. Reallocate from Shopping next month to get back on track!",
    rebalanceTip: `Asset mismatch: Equity represents ${equityPct}% of your portfolio. Your target is 50% for a ${riskProfile} risk profile. Consider a SIP redirect.`
  };
}

module.exports = {
  /**
   * Ask Cashius a financial question
   */
  askCashius: async (userContext, history, messageText) => {
    try {
      // Prepare message array for Claude
      const messages = [];
      
      // Load history
      history.slice(-8).forEach(msg => {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.message
        });
      });

      // Context injection in prompt
      const contextString = `
Customer Profile:
- Name: ${userContext.name}
- Email: ${userContext.email}
- Risk Profile: ${userContext.riskProfile}
- Monthly Income: ₹${userContext.monthlyIncome}
- Portfolio Value: ₹${userContext.portfolio.reduce((sum, h) => sum + h.current_value, 0)}
- Portfolio Holdings: ${JSON.stringify(userContext.portfolio)}
- Financial Goals: ${JSON.stringify(userContext.goals)}
- Recent Transactions (June 2026): ${JSON.stringify(userContext.transactions.filter(t => t.date.startsWith('2026-06')))}
`;

      messages.push({
        role: 'user',
        content: `${contextString}\n\nCustomer Message: ${messageText}`
      });

      const response = await callAI(SYSTEM_PROMPT, messages);
      return response;
    } catch (error) {
      console.warn('AI Advisory (Groq/Claude API) call failed, returning smart fallback response:', error.message);
      return getLocalFallbackAdvice(userContext, messageText);
    }
  },

  /**
   * Get personalized insights and nudges for dashboard
   */
  getDashboardInsights: async (userContext) => {
    try {
      const messages = [{
        role: 'user',
        content: `Generate a single short insight card, a quick warning nudge, and a portfolio suggestion in JSON format for the user based on their profile.
Context:
- Name: ${userContext.name}
- Risk Profile: ${userContext.riskProfile}
- Monthly Income: ${userContext.monthlyIncome}
- Portfolio: ${JSON.stringify(userContext.portfolio)}
- Goals: ${JSON.stringify(userContext.goals)}
- June Transactions: ${JSON.stringify(userContext.transactions.filter(t => t.date.startsWith('2026-06')))}

JSON format:
{
  "insight": "Insight text (max 200 chars)",
  "nudge": "Short alert/nudge text (max 100 chars)",
  "rebalanceTip": "Short portfolio/SIP rebalancing tip (max 100 chars)"
}`
      }];

      const rawResponse = await callAI(SYSTEM_PROMPT + "\nResponse format MUST be valid JSON only. Do not wrap in markdown code blocks.", messages, true);
      return JSON.parse(rawResponse);
    } catch (error) {
      console.warn('Dashboard AI Insight (Groq/Claude API) failed, returning local fallback dashboard advice:', error.message);
      return getLocalFallbackAdvice(userContext);
    }
  }
};
