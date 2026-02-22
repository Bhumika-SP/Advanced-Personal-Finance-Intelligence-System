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

module.exports = { suggestCategory };
