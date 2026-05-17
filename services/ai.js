const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY || "";
let genAI = null;
if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (_) {
    genAI = null;
  }
}

function basicHeuristicCategory(description = "", amount = 0) {
  const d = description.toLowerCase();
  if (/(zomato|swiggy|uber eats|restaurant|cafe|food|meal)/.test(d)) return { category: "Food & Dining", confidence: 0.6, rationale: "Matched food-related keywords" };
  if (/(ola|uber|cab|taxi|metro|bus|train|flight|fuel|petrol|diesel)/.test(d)) return { category: "Transport", confidence: 0.6, rationale: "Matched transport-related keywords" };
  if (/(amazon|flipkart|myntra|shopping|clothes|apparel)/.test(d)) return { category: "Shopping", confidence: 0.55, rationale: "Matched shopping-related keywords" };
  if (/(rent|electricity|water|gas|internet|wifi|broadband|mobile bill)/.test(d)) return { category: "Bills & Utilities", confidence: 0.6, rationale: "Matched utility-related keywords" };
  if (/(pharmacy|medical|doctor|hospital|medicine)/.test(d)) return { category: "Health", confidence: 0.55, rationale: "Matched health-related keywords" };
  if (/(movie|entertainment|subscription|netflix|prime|spotify)/.test(d)) return { category: "Entertainment", confidence: 0.5, rationale: "Matched entertainment-related keywords" };
  if (amount >= 50000) return { category: "Large Purchase", confidence: 0.4, rationale: "High amount heuristic" };
  return { category: "General", confidence: 0.3, rationale: "Fallback heuristic" };
}

async function suggestCategory({ description, amount, candidates = [] }) {
  const heuristic = basicHeuristicCategory(description, Number(amount) || 0);
  if (!genAI) return { ...heuristic, model: "heuristic" };

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const system = `You are helping categorize personal finance transactions into concise categories.
Return a compact JSON with keys: category (string), confidence (0-1), rationale (short string).
If candidates are provided, prefer one of them if reasonable. Keep category short (<=3 words).`;

  const prompt = [
    system,
    `Description: ${description || ""}`,
    `Amount: ${amount || 0}`,
    `Candidates: ${Array.isArray(candidates) ? candidates.join(", ") : ""}`,
    `Output only JSON.`
  ].join("\n");

  try {
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || "";
    const jsonText = text.trim().replace(/^```json\n?|```$/g, "");
    const parsed = JSON.parse(jsonText);
    const category = String(parsed.category || heuristic.category).slice(0, 50);
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence ?? heuristic.confidence)));
    const rationale = String(parsed.rationale || "").slice(0, 200);
    return { category, confidence, rationale, model: "gemini-1.5-flash" };
  } catch (_) {
    return { ...heuristic, model: "heuristic" };
  }
}

function fallbackChatResponse(prompt, context) {
  const p = prompt.toLowerCase();

  if (p.includes('spend') || p.includes('spent') || p.includes('expenses')) {
    return `Based on your recent data, you have spent ₹${context.totalExpenses || 0} across ${context.expenseCount || 0} transactions this month. Your highest spending category is ${context.topCategory || 'N/A'}.`;
  }
  if (p.includes('save') || p.includes('savings')) {
    return `You have saved ₹${context.totalSavings || 0} recently. Setting aside a consistent percentage of your income (which is ₹${context.totalIncome || 0}) can help improve your savings ratio.`;
  }
  if (p.includes('budget')) {
    return context.budgetAlerts && context.budgetAlerts.length > 0
      ? `Warning: You are nearing or exceeding your budget in: ${context.budgetAlerts.join(', ')}.`
      : `Your budgets look healthy! You have ${context.budgetCount || 0} active budgets this month.`;
  }
  if (p.includes('category') || p.includes('categories') || p.includes('top')) {
    return `Your top spending category is ${context.topCategory || 'N/A'}. Keep an eye on recurring expenses in this category to optimize your budget.`;
  }

  return `I'm currently operating in offline mode. Your monthly spending is ₹${context.totalExpenses || 0} and your top category is ${context.topCategory || 'N/A'}. How else can I help?`;
}

async function generateChatResponse(prompt, context = {}, history = []) {
  const sanitizedPrompt = String(prompt).trim().slice(0, 500); // Sanitize and limit length

  if (!genAI) {
    return fallbackChatResponse(sanitizedPrompt, context);
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Build a token-efficient context string
  const contextStr = JSON.stringify({
    spend: context.totalExpenses || 0,
    income: context.totalIncome || 0,
    saved: context.totalSavings || 0,
    topCat: context.topCategory || "None",
    budgets: context.budgetCount || 0,
    alerts: context.budgetAlerts || []
  });

  const systemPrompt = `You are Expensio AI, a personal finance assistant. 
Be concise, helpful, and professional. Use ₹ for currency.
User Data Context: ${contextStr}
Do not mention that you are an AI unless asked. Answer the user's question directly based ONLY on their context.`;

  // Format history for Gemini
  const contents = [];

  // Filter history: remove the last user message because it's the current prompt,
  // which we append manually with system context. Also ensures alternating roles.
  let validHistory = history.filter(msg => msg.role === 'user' || msg.role === 'assistant');
  if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
    validHistory.pop(); // Remove the current prompt that was just saved to DB
  }

  // Add history
  validHistory.slice(-4).forEach(msg => { // Last 2 turns (4 messages)
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    });
  });

  // Add current prompt with system instructions
  contents.push({
    role: 'user',
    parts: [{ text: `System: ${systemPrompt}\n\nUser Question: ${sanitizedPrompt}` }]
  });

  let timeoutId;
  try {
    // Timeout Promise
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Gemini API timeout')), 12000);
    });

    const apiPromise = model.generateContent({ contents });

    const result = await Promise.race([apiPromise, timeoutPromise]);
    clearTimeout(timeoutId);

    if (result && result.response) {
      return result.response.text();
    }
    throw new Error("Invalid response from Gemini");
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Gemini Error:", error.message);
    return fallbackChatResponse(sanitizedPrompt, context);
  }
}

module.exports = { suggestCategory, generateChatResponse };
