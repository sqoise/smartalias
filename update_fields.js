const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'components', 'public', 'RegisterCard.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add min-h-[34px] to all fields that don't have it
content = content.replace(
  /px-2\.5 py-1\.5 text-xs border transition-all duration-200 \$\{/g,
  'px-2.5 py-1.5 text-xs border transition-all duration-200 min-h-[34px] ${'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated all field heights successfully!');