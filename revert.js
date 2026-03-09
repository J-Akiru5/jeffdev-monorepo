const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
  const exts = ['.tsx', '.ts', '.md', '.mdx', '.json', '.css'];
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', '.git', '.next', 'dist', 'build', '.turbo', '.agent'].includes(file)) {
        replaceInDir(fullPath);
      }
    } else {
      if (exts.includes(path.extname(fullPath))) {
        let content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('syntaxurelabs.com')) {
          // Keep prism.syntaxurelabs.com if the user wants Prism kept as is?
          // No, Prism dashboard is also meant to be prism.jeffdev.studio 
          // (per Implementation plan: "Domain URLs (keeping jeffdev.studio...)")
          content = content.replace(/syntaxurelabs\.com/g, 'jeffdev.studio');
          content = content.replace(/SyntaxureLabs/g, 'JeffDev');
          fs.writeFileSync(fullPath, content);
          console.log(`Reverted in ${fullPath}`);
        }
      }
    }
  }
}

replaceInDir(path.join(__dirname, 'apps'));
replaceInDir(path.join(__dirname, 'packages'));
console.log('Reversion complete.');
