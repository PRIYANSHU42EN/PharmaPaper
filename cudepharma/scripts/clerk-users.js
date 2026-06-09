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

async function listUsers() {
  try {
    const res = await fetch("https://api.clerk.com/v1/users", {
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Error from Clerk:", err);
      return;
    }

    const users = await res.json();
    console.log("Clerk Users List:");
    users.forEach(u => {
      const email = u.email_addresses?.[0]?.email_address || "No Email";
      console.log(`- ID: ${u.id}`);
      console.log(`  Name: ${u.first_name || ""} ${u.last_name || ""}`);
      console.log(`  Email: ${email}`);
      console.log(`  Public Metadata: ${JSON.stringify(u.public_metadata)}`);
      console.log('---');
    });
  } catch (err) {
    console.error("Request failed:", err);
  }
}

listUsers();
