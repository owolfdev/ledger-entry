# Secure GitHub Token Storage Migration

This document outlines the migration from storing GitHub PATs in user metadata to secure encrypted storage in the `user_github_tokens` database table.

## Security Improvements

### Before (User Metadata)

- ❌ Stored in plain text
- ❌ Visible in Supabase dashboard
- ❌ No access controls
- ❌ Not encrypted

### After (Database Table)

- ✅ Encrypted with AES-256-GCM
- ✅ Row-level security (RLS) policies
- ✅ Proper access controls
- ✅ Audit trail with timestamps

## Setup Instructions

### 1. Generate Encryption Key

Run the key generation script:

```bash
node scripts/generate-encryption-key.js
```

This will output a 64-character hex string. Add it to your environment variables:

```bash
# In your .env.local file
ENCRYPTION_KEY=your_generated_key_here

# In Vercel dashboard
ENCRYPTION_KEY=your_generated_key_here
```

### 2. Apply Database Migrations

Run the RLS policies migration in your Supabase dashboard:

```sql
-- Copy and paste the contents of supabase/migrations/001_user_github_tokens_rls.sql
```

### 3. Test the Implementation

1. Start your development server
2. Try storing a GitHub PAT through the UI
3. Check that it's stored in the `user_github_tokens` table
4. Verify that the token is encrypted (not readable as plain text)

## API Changes

### New Functions

- `storeGitHubToken(userId, token)` - Encrypts and stores PAT
- `getStoredGitHubToken()` - Retrieves and decrypts PAT
- `deleteStoredGitHubToken()` - Removes PAT from database

### Updated Endpoints

- `POST /api/github/store-token` - Now validates token format and uses encrypted storage

## Database Schema

The `user_github_tokens` table structure:

```sql
CREATE TABLE user_github_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  encrypted_pat TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Features

### Encryption

- Uses AES-256-GCM encryption
- Key derived from environment variable
- Each token encrypted with unique IV
- Authentication tag prevents tampering

### Access Control

- Row-level security policies
- Users can only access their own tokens
- No cross-user data leakage

### Audit Trail

- Created/updated timestamps
- Automatic timestamp updates on changes

## Migration Notes

- Existing OAuth tokens will continue to work as fallback
- New PATs will be stored securely in the database
- Old metadata tokens will be gradually replaced as users re-authenticate

## Troubleshooting

### Common Issues

1. **"ENCRYPTION_KEY environment variable is required"**

   - Make sure you've set the ENCRYPTION_KEY in your environment

2. **"Failed to decrypt token"**

   - Check that the ENCRYPTION_KEY is correct
   - Ensure the key hasn't changed since token storage

3. **"No GitHub token found in database"**
   - User needs to store a PAT through the UI
   - Check that RLS policies are applied correctly

### Testing

To test the encryption/decryption:

```javascript
import { encryptToken, decryptToken } from "@/lib/encryption";

const testToken = "ghp_test123456789";
const encrypted = encryptToken(testToken);
const decrypted = decryptToken(encrypted);

console.log("Original:", testToken);
console.log("Encrypted:", encrypted);
console.log("Decrypted:", decrypted);
console.log("Match:", testToken === decrypted);
```
