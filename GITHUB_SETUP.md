# GitHub OAuth Setup Guide

This app supports GitHub OAuth authentication, allowing users to sign in with their GitHub accounts and access their repositories.

## Prerequisites

- A Supabase project with authentication enabled
- A GitHub account
- Environment variables configured (see `.env.example`)

## Step 1: Create a GitHub OAuth App

1. Go to [GitHub Settings > Developer settings > OAuth Apps](https://github.com/settings/applications/new)
2. Click "New OAuth App"
3. Fill in the following details:
   - **Application name**: Your app name (e.g., "My File Manager")
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `https://your-project-ref.supabase.co/auth/v1/callback`
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret** (you'll need these for Supabase)

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication > Providers**
4. Find **GitHub** in the list and click on it
5. Toggle **Enable GitHub provider**
6. Enter your GitHub OAuth credentials:
   - **Client ID**: From your GitHub OAuth app
   - **Client Secret**: From your GitHub OAuth app
7. Click **Save**

## Step 3: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```
2. Go to `http://localhost:3000`
3. Click "Test GitHub OAuth" to verify the setup
4. You should be redirected to GitHub for authentication

## How It Works

### Authentication Flow

1. User clicks "Continue with GitHub" on login/signup page
2. App calls `supabase.auth.signInWithOAuth()` with GitHub provider
3. User is redirected to GitHub OAuth page
4. User authorizes the app on GitHub
5. GitHub redirects back to your app with authorization code
6. Supabase exchanges the code for access token
7. User is authenticated and redirected to `/protected`

### Repository Access

Once authenticated, users can:

- View their GitHub repositories
- Browse repository files and directories
- Read file contents
- Edit files (with proper permissions)
- Create/delete files (with proper permissions)

### Permissions

The app respects GitHub repository permissions:

- **Read access**: Users can browse and view files
- **Write access**: Users can edit, create, and delete files
- **Admin access**: Full repository management capabilities

## Troubleshooting

### Common Issues

1. **"GitHub authentication failed" error**

   - Check if GitHub OAuth app is properly configured
   - Verify callback URL matches exactly
   - Ensure Client ID and Secret are correct in Supabase

2. **No repositories showing**

   - User needs to grant repository access during OAuth
   - Check if user has any repositories
   - Verify GitHub token is stored in Supabase

3. **Permission denied errors**
   - User doesn't have required permissions for the repository
   - Repository might be private and user doesn't have access

### Debug Steps

1. Check browser console for error messages
2. Verify Supabase logs in the dashboard
3. Test OAuth flow step by step
4. Ensure all environment variables are set

## Security Notes

- GitHub access tokens are stored securely in Supabase
- Tokens are automatically refreshed when needed
- Users can revoke access anytime from their GitHub settings
- Repository access is limited to what the user has permission for

## Production Deployment

For production deployment:

1. Update GitHub OAuth app settings:

   - Change Homepage URL to your production domain
   - Update Authorization callback URL to your production Supabase callback URL

2. Update Supabase configuration:

   - Ensure production callback URL is configured
   - Test the OAuth flow in production

3. Environment variables:
   - Use production Supabase URL and keys
   - Ensure all GitHub OAuth settings are production-ready
