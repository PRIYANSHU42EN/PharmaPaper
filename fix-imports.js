const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src', 'app'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/from\s+['"](\.\.\/)+lib\/(.*?)['"]/g, 'from "@/lib/$2"');
  newContent = newContent.replace(/from\s+['"](\.\.\/)+components\/(.*?)['"]/g, 'from "@/components/$2"');
  newContent = newContent.replace(/from\s+['"](\.\.\/)+features\/(.*?)['"]/g, 'from "@/features/$2"');
  newContent = newContent.replace(/from\s+['"](\.\.\/)+hooks\/(.*?)['"]/g, 'from "@/hooks/$2"');
  
  newContent = newContent.replace(/import\s+['"](\.\.\/)+lib\/(.*?)['"]/g, 'import "@/lib/$2"');
  newContent = newContent.replace(/import\s+['"](\.\.\/)+components\/(.*?)['"]/g, 'import "@/components/$2"');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated ${file}`);
  }
}
