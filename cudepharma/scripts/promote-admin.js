const fs = require('fs');
const path = require('path');

let secretKey = '';

try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('CLERK_SECRET_KEY=')) {
      secretKey = line.split('=')[1].trim();
      break;
    }
  }
} catch (e) {
  console.error("Failed to read .env.local file:", e);
}

if (!secretKey) {
  console.error("Error: CLERK_SECRET_KEY not found in .env.local");
  process.exit(1);
}

const usersToPromote = [
  "user_3ElmuQf7zkSWfsF8Q7uBzJN4g1B", // nothing.by.14@gmail.com
  "user_3EllzoEyeubw5NOOptxiWGetAnc"  // smashgaming5488@gmail.com
];

async function promoteUsers() {
  for (const userId of usersToPromote) {
    console.log(`Promoting user ${userId} to admin in Clerk via PATCH...`);
    try {
      const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${secretKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          public_metadata: {
            role: "admin"
          }
        })
      });

      console.log(`Response status: ${res.status}`);
      const text = await res.text();
      console.log(`Response text snippet: ${text.slice(0, 300)}`);
    } catch (err) {
      console.error(`Request failed for user ${userId}:`, err);
    }
  }
}

promoteUsers();
