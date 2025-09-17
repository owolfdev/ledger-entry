# GitHub OAuth Token Issue - Fix Guide

## Problem

The app shows "No Repositories Found" even though you're authenticated with GitHub. This happens because the GitHub access token isn't being stored properly in Supabase.

## Root Cause

Supabase needs to be configured to store the GitHub access token when users authenticate. By default, it only stores basic user information.

## Solution Steps

### 1. Configure GitHub OAuth App Scopes

Your GitHub OAuth app needs to request the correct scopes:

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/applications)
2. Find your OAuth app and click "Edit"
3. Make sure these scopes are requested:
   - `repo` (Full control of private repositories)
   - `user:email` (Access to user email addresses)

### 2. Configure Supabase GitHub Provider

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Authentication > Providers**
3. Click on **GitHub** provider
4. Make sure these settings are configured:
   - **Enable GitHub provider**: ✅ ON
   - **Client ID**: Your GitHub OAuth app Client ID
   - **Client Secret**: Your GitHub OAuth app Client Secret
   - **Redirect URL**: `https://your-project-ref.supabase.co/auth/v1/callback`

### 3. Update Supabase Auth Configuration

In your Supabase project, you need to configure the auth settings to store the GitHub token:

1. Go to **Authentication > Settings**
2. Look for **External OAuth Providers**
3. Make sure **Store provider tokens** is enabled
4. Or add this to your Supabase project settings:

```sql
-- Run this in your Supabase SQL editor
UPDATE auth.config
SET raw_user_meta_data = true
WHERE key = 'github';
```

### 4. Alternative: Use Supabase Edge Functions

If the above doesn't work, you can use a Supabase Edge Function to handle the GitHub token:

1. Create a new Edge Function in Supabase
2. Use the function to exchange the GitHub code for a token
3. Store the token in your database

### 5. Test the Fix

1. **Clear your browser data** (cookies, local storage)
2. **Sign out** of your app
3. **Sign in again** with GitHub
4. Check the debug component on `/repositories` page
5. You should see "GitHub token found" status

## Debug Information

The debug component on the repositories page will show:

- User authentication status
- Available metadata keys
- Whether GitHub token is present
- Specific error messages

## Expected Behavior After Fix

After proper configuration:

1. User clicks "Continue with GitHub"
2. GitHub OAuth dialog opens
3. User authorizes the app
4. Supabase stores the GitHub access token
5. App can fetch user's repositories
6. Repository list displays correctly

## Common Issues

### Issue: "No GitHub token found"

**Solution**: Re-authenticate with GitHub after configuring scopes

### Issue: "Insufficient scopes"

**Solution**: Update GitHub OAuth app to request `repo` scope

### Issue: "Invalid redirect URI"

**Solution**: Ensure callback URL matches exactly in both GitHub and Supabase

### Issue: "Provider not enabled"

**Solution**: Enable GitHub provider in Supabase dashboard

## Verification Steps

1. Check Supabase logs for OAuth errors
2. Verify GitHub OAuth app configuration
3. Test with a fresh browser session
4. Use the debug component to inspect user data

## Need Help?

If you're still having issues:

1. Check the browser console for errors
2. Look at Supabase logs in the dashboard
3. Verify all configuration steps were completed
4. Try creating a new GitHub OAuth app with correct settings
