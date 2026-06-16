const fs = require('fs');
const path = require('path');

const srcAppDir = path.join(__dirname, 'src', 'app');

// 1. Create Route Groups
const marketingDir = path.join(srcAppDir, '(marketing)');
const studentGroupDir = path.join(srcAppDir, '(student)');
const adminGroupDir = path.join(srcAppDir, '(admin)');

const studentDir = path.join(studentGroupDir, 'app');
const adminDir = path.join(adminGroupDir, 'admin');

// Ensure directories exist
[marketingDir, studentGroupDir, adminGroupDir, studentDir, adminDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Marketing Pages
const marketingItems = ['page.tsx', 'pricing', 'contact', 'privacy', 'terms'];

// Admin Pages
const adminItems = ['admin'];

// Student Pages (everything else except api, layout, etc.)
const excludeFromStudent = ['api', 'favicon.ico', 'globals.css', 'layout.tsx', 'not-found.tsx', 'error.tsx', '(marketing)', '(student)', '(admin)'];

const allItems = fs.readdirSync(srcAppDir);

function safeMove(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true });
  fs.rmSync(src, { recursive: true, force: true });
}

for (const item of allItems) {
  const itemPath = path.join(srcAppDir, item);
  
  if (excludeFromStudent.includes(item) || marketingItems.includes(item) || adminItems.includes(item)) {
    continue;
  }

  safeMove(itemPath, path.join(studentDir, item));
}

for (const item of marketingItems) {
  const itemPath = path.join(srcAppDir, item);
  safeMove(itemPath, path.join(marketingDir, item));
}

const currentAdminDir = path.join(srcAppDir, 'admin');
if (fs.existsSync(currentAdminDir)) {
  const adminFiles = fs.readdirSync(currentAdminDir);
  for (const file of adminFiles) {
    safeMove(path.join(currentAdminDir, file), path.join(adminDir, file));
  }
  fs.rmSync(currentAdminDir, { recursive: true, force: true });
}

console.log('Folders reorganized successfully!');
