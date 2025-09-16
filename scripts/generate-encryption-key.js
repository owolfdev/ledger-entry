#!/usr/bin/env node

/**
 * Script to generate a secure encryption key for GitHub PAT storage
 * Run this once to generate your ENCRYPTION_KEY environment variable
 */

const crypto = require("crypto");

function generateEncryptionKey() {
  return crypto.randomBytes(32).toString("hex");
}

const key = generateEncryptionKey();

console.log("🔐 Generated Encryption Key:");
console.log(key);
console.log("\n📝 Add this to your environment variables:");
console.log(`ENCRYPTION_KEY=${key}`);
console.log("\n⚠️  IMPORTANT:");
console.log(
  "- Store this key securely (e.g., in Vercel environment variables)"
);
console.log("- Never commit this key to version control");
console.log(
  "- If you lose this key, all encrypted tokens will be unrecoverable"
);
console.log("- Keep a backup of this key in a secure location");
