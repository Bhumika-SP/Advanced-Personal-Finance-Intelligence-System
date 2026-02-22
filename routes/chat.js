const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Expense = require("../models/Expense");
const Budget = require("../models/Budget");
const mongoose = require("mongoose");
const ChatMessage = require("../models/ChatMessage");

function monthRangeFromText(text) {
  const now = new Date();
  const lc = (text || "").toLowerCase();
  const m = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const e = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
  if (/last\s+month/.test(lc)) {
    const s = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59));
    return { start: s, end: t, label: "last month" };
  }
  const ym = lc.match(/(20\d{2})[-\/ ](0[1-9]|1[0-2])/);
  if (ym) {
    const y = Number(ym[1]);
    const mm = Number(ym[2]);
    const s = new Date(Date.UTC(y, mm - 1, 1));
    const t = new Date(Date.UTC(y, mm, 0, 23, 59, 59));
    return { start: s, end: t, label: `${y}-${String(mm).padStart(2,'0')}` };
  }
  return { start: m, end: e, label: "this month" };
}

function extractCategoryRaw(text) {
  const m = (text || "").match(/category\s+([\w &]+)/i);
  if (m) return m[1].trim();
  const on = (text || "").match(/on\s+([\w &]+)/i);
  if (on) return on[1].trim();
  return null;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveCategory(userId, raw) {
  if (!raw) return null;
  const lc = raw.toLowerCase().trim();
  const aliases = new Map([
    ["food", "Food & Dining"],
    ["dining", "Food & Dining"],
    ["groceries", "Food & Dining"],
    ["transport", "Transport"],
    ["travel", "Transport"],
    ["fuel", "Transport"],
    ["bills", "Bills & Utilities"],
    ["utilities", "Bills & Utilities"],
    ["shopping", "Shopping"],
    ["health", "Health"],
    ["medical", "Health"],
    ["entertainment", "Entertainment"],
    ["subscriptions", "Entertainment"]
  ]);
  if (aliases.has(lc)) return aliases.get(lc);
  // Try to find a user's existing category that matches case-insensitively
  const any = await Expense.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: "$category", n: { $sum: 1 } } },
    { $sort: { n: -1 } },
    { $limit: 100 }
  ]);
  const hit = any.find(x => String(x._id).toLowerCase() === lc);
  if (hit) return hit._id;
  return raw; // fallback
}

// async function handleQuery(userId, text) {
//   const { start, end, label } = monthRangeFromText(text);
//   const catRaw = extractCategoryRaw(text);
//   const cat = await resolveCategory(userId, catRaw);
//   if (/top\s+categor(y|ies)|biggest\s+spend/i.test(text)) {
//     const agg = await Expense.aggregate([
//       { $match: { user: new mongoose.Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
//       { $group: { _id: "$category", total: { $sum: "$amount" } } },
//       { $sort: { total: -1 } },
//       { $limit: 5 }
//     ]);
//     if (!agg.length) return `No expenses in ${label}.`;
//     const lines = agg.map(a => `${a._id}: ₹${a.total}`).join("; ");
//     return `Top categories in ${label}: ${lines}.`;
//   }
//   if (/budget/i.test(text)) {
//     const ym = `${start.getUTCFullYear()}-${String(start.getUTCMonth()+1).padStart(2,'0')}`;
//     const budgets = await Budget.find({ user: userId, period: ym });
//     if (!budgets.length) return `No budgets set for ${ym}.`;
//     const byCat = new Map(budgets.map(b => [b.category, b.amount]));
//     const spent = await Expense.aggregate([
//       { $match: { user: new mongoose.Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
//       { $group: { _id: "$category", spent: { $sum: "$amount" } } }
//     ]);
//     const lines = budgets.map(b => {
//       const s = spent.find(x => x._id === b.category)?.spent || 0;
//       const rem = Math.max(0, b.amount - s);
//       const flag = s > b.amount ? "⚠ overspent" : "";
//       return `${b.category}: spent ₹${s} of ₹${b.amount} (left ₹${rem}) ${flag}`;
//     }).join("; ");
//     return `Budget status for ${ym}: ${lines}.`;
//   }
//   if (/total|spend|spent/i.test(text)) {
//     const match = cat
//       ? await Expense.aggregate([
//           { $match: { user: new mongoose.Types.ObjectId(userId), category: { $regex: `^${escapeRegex(cat)}$`, $options: 'i' }, date: { $gte: start, $lte: end } } },
//           { $group: { _id: null, total: { $sum: "$amount" } } }
//         ])
//       : await Expense.aggregate([
//           { $match: { user: new mongoose.Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
//           { $group: { _id: null, total: { $sum: "$amount" } } }
//         ]);
//     const total = match[0]?.total || 0;
//     if (cat) return `You spent ₹${total} on ${cat} in ${label}.`;
//     return `You spent ₹${total} in ${label}.`;
//   }
//   const count = await Expense.countDocuments({ user: userId, date: { $gte: start, $lte: end } });
//   return `You have ${count} transactions in ${label}. Ask for totals, top categories, or budget status.`;
// }

// router.get("/", auth, async (req, res) => {
//   // Only return the chat page, no messages initially
//   res.render("chat", { 
//     messages: [],
//     currentPath: req.path
//   });
// });

// router.post("/message", auth, async (req, res) => {
//   try {
//     const text = (req.body && req.body.text) || "";
    
//     // Save user message to database
//     await ChatMessage.create({ user: req.userId, role: 'user', text });
    
//     // Get AI response
//     const reply = await handleQuery(req.userId, text);
    
//     // Save AI response to database
//     await ChatMessage.create({ user: req.userId, role: 'assistant', text: reply });
    
//     // Return JSON response with the AI's reply
//     res.json({ 
//       success: true, 
//       reply: reply 
//     });
//   } catch (e) {
//     console.error('Error processing chat message:', e);
//     res.status(500).json({ 
//       success: false, 
//       reply: 'Sorry, something went wrong. Please try again.' 
//     });
//   }
// });


async function handleQuery(userId, text) {
  try {
    const lcText = text.toLowerCase();
    const { start, end, label } = monthRangeFromText(lcText);
    const catRaw = extractCategoryRaw(lcText);
    const cat = await resolveCategory(userId, catRaw);

    // Get all expenses for the time period
    const expenses = await Expense.find({ 
      user: new mongoose.Types.ObjectId(userId), 
      date: { $gte: start, $lte: end } 
    }).sort({ date: -1 });

    // Handle specific queries
    if (/how much (did i spend|have i spent|was spent)/i.test(lcText)) {
      if (cat) {
        const total = expenses
          .filter(e => e.category.toLowerCase() === cat.toLowerCase())
          .reduce((sum, e) => sum + e.amount, 0);
        return `You've spent ₹${total.toFixed(2)} on ${cat} ${label}.`;
      } else {
        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        return `You've spent a total of ₹${total.toFixed(2)} ${label}.`;
      }
    }

    if (/what (did i spend on|are my expenses for)/i.test(lcText)) {
      if (expenses.length === 0) return `You have no expenses recorded ${label}.`;
      
      const categories = [...new Set(expenses.map(e => e.category))];
      return `Your expenses ${label} are in these categories: ${categories.join(', ')}. ` +
             `You can ask for more details about any category.`;
    }

    if (/show (me )?(my )?(recent )?expenses?/i.test(lcText)) {
      const limit = 5; // Show last 5 expenses by default
      const recent = expenses.slice(0, limit);
      if (recent.length === 0) return `No recent expenses found ${label}.`;
      
      const formatted = recent.map(e => 
        `${e.date.toLocaleDateString()}: ₹${e.amount.toFixed(2)} on ${e.category}${e.description ? ` (${e.description})` : ''}`
      ).join('\n');
      
      return `Your recent expenses ${label}:\n${formatted}`;
    }

    if (/how much (did i spend|have i spent|was spent) on (.*)/i.test(lcText)) {
      const match = lcText.match(/how much (?:did i spend|have i spent|was spent) on (.*)/i);
      if (match) {
        const item = match[1].trim();
        const itemExpenses = expenses.filter(e => 
          e.description && e.description.toLowerCase().includes(item)
        );
        
        if (itemExpenses.length === 0) {
          return `You haven't spent anything on ${item} ${label}.`;
        }
        
        const total = itemExpenses.reduce((sum, e) => sum + e.amount, 0);
        return `You've spent ₹${total.toFixed(2)} on ${item} ${label} across ${itemExpenses.length} transactions.`;
      }
    }

    // Default response for other queries
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const categories = [...new Set(expenses.map(e => e.category))];
    
    return `I can help you with your expenses. Here's a summary ${label}:
- Total spent: ₹${totalSpent.toFixed(2)}
- Number of transactions: ${expenses.length}
- Categories: ${categories.join(', ')}

You can ask me:
- How much did I spend on [category]?
- Show my recent expenses
- What did I spend on [date]?
- How much did I spend on [item]?`;
  } catch (error) {
    console.error('Error in handleQuery:', error);
    return "I'm sorry, I encountered an error while processing your request. Please try again.";
  }
}

module.exports = router;
