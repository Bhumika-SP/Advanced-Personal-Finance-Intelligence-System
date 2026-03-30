const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'views');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.ejs') && f !== 'welcome.ejs' && f !== 'login.ejs' && f !== 'signup.ejs');

files.forEach(file => {
  const filePath = path.join(viewsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  const baseName = file.replace('.ejs', '');

  // 1. Replace entire <aside> block with the EJS include
  const asideRegex = /<aside\b[^>]*>[\s\S]*?<\/aside>/;
  if (asideRegex.test(content)) {
    content = content.replace(asideRegex, `<%- include('partials/sidebar', { activeTab: '${baseName}' }) %>`);
  }

  // 2. Add Lucide scripts before </body> if not present
  if (!content.includes('lucide.createIcons()')) {
    const scriptTag = `\n  <script src="https://unpkg.com/lucide@latest"></script>\n  <script>\n    lucide.createIcons();\n  </script>\n`;
    content = content.replace(/<\/body>/, `${scriptTag}</body>`);
  }

  // 3. Table Action Replacements: Edit -> <i data-lucide="edit"></i>
  // Look for text Edit inside an a tag
  content = content.replace(/>\s*Edit\s*<\/a>/g, `><i data-lucide="edit" class="w-4 h-4 inline-block align-text-bottom mr-1"></i> Edit</a>`);
  // Look for text Delete inside a button
  content = content.replace(/>\s*Delete\s*<\/button>/g, `><i data-lucide="trash-2" class="w-4 h-4 inline-block align-text-bottom mr-1"></i> Delete</button>`);

  // Extra generic table action matches (if any other variation exists)
  content = content.replace(/<span class="text-red-400">• Overspent<\/span>/g, `<span class="text-red-400 flex items-center gap-1"><i data-lucide="alert-circle" class="w-3 h-3"></i> Overspent</span>`);

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});

console.log("Global Sidebar and Lucide refactor complete.");
