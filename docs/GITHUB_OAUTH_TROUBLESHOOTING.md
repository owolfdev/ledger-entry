# GitHub OAuth Troubleshooting Guide

## Current Error

```
http://localhost:3000/?error=server_error&error_code=unexpected_failure&error_description=Error+getting+user+profile+from+external+provider
```

This error indicates that:

1. OAuth flow is working (redirecting back to your app)
2. Supabase is trying to get user profile from GitHub
3. GitHub is rejecting the request or returning an error

## Root Cause

The GitHub OAuth app configuration in Supabase is likely incorrect or incomplete.

## Solution Steps

### 1. Check GitHub OAuth App Configuration

1. Go to GitHub Settings: https://github.com/settings/applications
2. Find your OAuth app (or create a new one)
3. Verify these settings:
   - **Application name**: `Ledger Entry` (or similar)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `https://afhwkquktdnasvhyudez.supabase.co/auth/v1/callback`

### 2. Check Supabase GitHub Provider Configuration

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/afhwkquktdnasvhyudez/auth/providers
2. Click on "GitHub" provider
3. Verify these settings:
   - **Client ID**: Should match your GitHub OAuth app Client ID
   - **Client Secret**: Should match your GitHub OAuth app Client Secret
   - **Enabled**: Should be checked

### 3. Check Supabase URL Configuration

1. Go to: https://supabase.com/dashboard/project/afhwkquktdnasvhyudez/auth/url-configuration
2. Verify these settings:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Should include:
     - `http://localhost:3000/auth/callback`
     - `https://ledger-entry.vercel.app/auth/callback`

### 4. Test the Configuration

1. Use the debug button in the app to test OAuth URL generation
2. Check browser console for any errors
3. Check server logs for detailed error information

## Common Issues

### Issue 1: Wrong Callback URL

- **Problem**: GitHub OAuth app callback URL doesn't match Supabase
- **Solution**: Update GitHub OAuth app callback URL to: `https://afhwkquktdnasvhyudez.supabase.co/auth/v1/callback`

### Issue 2: Missing Scopes

- **Problem**: GitHub OAuth app doesn't have required scopes
- **Solution**: Ensure your GitHub OAuth app has `repo` and `user:email` scopes

### Issue 3: Client Secret Mismatch

- **Problem**: Supabase has wrong GitHub Client Secret
- **Solution**: Copy the correct Client Secret from GitHub to Supabase

### Issue 4: Site URL Mismatch

- **Problem**: Supabase Site URL doesn't match your app URL
- **Solution**: Update Supabase Site URL to match your development URL

## Testing Steps

1. **Clear browser cache and cookies**
2. **Restart the development server**
3. **Try the OAuth flow again**
4. **Check the debug output in console**

## Debug Information

The app now includes debug logging that will show:

- Generated redirect URLs
- OAuth initiation results
- Detailed error messages
- User profile data (if successful)

Use the "🧪 Debug OAuth URL" button to test the configuration without actually initiating OAuth.
