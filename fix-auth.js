const fs = require('fs');
const path = require('path');

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        filelist = walk(path.join(dir, file), filelist);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      filelist.push(path.join(dir, file));
    }
  }
  return filelist;
}

const files = walk(path.join(__dirname, 'src'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Fix synchronous auth() destructuring
  if (content.includes('const { userId } = auth();')) {
    content = content.replace(/const { userId } = auth\(\);/g, 'const { userId } = await auth();');
    changed = true;
  }
  
  if (content.includes('const { userId, sessionClaims } = auth();')) {
    content = content.replace(/const { userId, sessionClaims } = auth\(\);/g, 'const { userId, sessionClaims } = await auth();');
    changed = true;
  }
  
  if (content.includes('const { sessionClaims, userId } = auth();')) {
    content = content.replace(/const { sessionClaims, userId } = auth\(\);/g, 'const { sessionClaims, userId } = await auth();');
    changed = true;
  }
  
  if (content.includes('const { userId: requesterId } = auth();')) {
    content = content.replace(/const { userId: requesterId } = auth\(\);/g, 'const { userId: requesterId } = await auth();');
    changed = true;
  }

  // 2. Fix requireRole
  if (content.includes('export function requireRole')) {
    content = content.replace(/export function requireRole/g, 'export async function requireRole');
    changed = true;
  }

  // 3. Fix requireRole callers
  if (content.includes('const authError = requireRole(')) {
    content = content.replace(/const authError = requireRole\(/g, 'const authError = await requireRole(');
    changed = true;
  }
  
  // 4. In case they use blocked_by: "admin", // from auth() - ignoring this one for now

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
console.log('Done!');
