const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'views');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.ejs') && f !== 'welcome.ejs' && f !== 'login.ejs' && f !== 'signup.ejs');

files.forEach(file => {
  const filePath = path.join(viewsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Remove duplicate lucide scripts (cleanup)
  content = content.replace(/<script src="https:\/\/unpkg\.com\/lucide@latest"><\/script>/g, '');
  content = content.replace(/<script>\s*lucide\.createIcons\(\);\s*<\/script>/g, '');

  // 2. Add exactly ONE lucide script block right before </body> unconditionally!
  if (content.includes('</body>')) {
    const lucidePayload = `\n  <!-- Global Lucide Icons Injection -->\n  <script src="https://unpkg.com/lucide@latest"></script>\n  <script>\n    document.addEventListener("DOMContentLoaded", function() {\n      lucide.createIcons();\n    });\n    // Fallback if already loaded\n    if (typeof lucide !== 'undefined') {\n      lucide.createIcons();\n    }\n  </script>\n</body>`;
    content = content.replace(/<\/body>/, lucidePayload);
  }

  // 3. Regex match any leftover table row icons using pure raw text replacements bridging standard EJS emojis to Lucide DOM
  // Matches "✏️ Edit" regardless of spacing
  content = content.replace(/[✏️✍️]+.*?Edit/g, `<i data-lucide="edit-3" class="w-4 h-4 inline-block mr-1"></i>Edit`);

  // Matches "🗑️ Delete" regardless of spacing
  content = content.replace(/[🗑️🚮]+.*?Delete/g, `<i data-lucide="trash-2" class="w-4 h-4 inline-block mr-1"></i>Delete`);

  // Add Expense button
  content = content.replace(/➕.*?Add Expense/g, `<i data-lucide="plus-circle" class="w-5 h-5 inline-block align-text-bottom mr-1"></i> Add Expense`);

  // Add Trip button
  content = content.replace(/✈️.*?Create Trip/g, `<i data-lucide="plane" class="w-5 h-5 inline-block align-text-bottom mr-1"></i> Create Trip`);

  // Add Income button
  content = content.replace(/➕.*?Add Income/g, `<i data-lucide="plus-circle" class="w-5 h-5 inline-block align-text-bottom mr-1"></i> Add Income`);

  // Add Budget button
  content = content.replace(/➕.*?Create Budget/g, `<i data-lucide="plus-circle" class="w-5 h-5 inline-block align-text-bottom mr-1"></i> Create Budget`);

  // Add Subscription button
  content = content.replace(/➕.*?Add Subscription/g, `<i data-lucide="plus-circle" class="w-5 h-5 inline-block align-text-bottom mr-1"></i> Add Subscription`);

  // Add Savings button
  content = content.replace(/➕.*?Log Savings/g, `<i data-lucide="plus-circle" class="w-5 h-5 inline-block align-text-bottom mr-1"></i> Log Savings`);

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned missing icons and validated Lucide scripts successfully for ${file}`);
  }
});
