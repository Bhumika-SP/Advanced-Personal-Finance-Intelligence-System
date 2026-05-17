const fs = require('fs');
const code = fs.readFileSync('node_modules/lucide/dist/umd/lucide.js', 'utf8');
console.log(code.includes('root'));
