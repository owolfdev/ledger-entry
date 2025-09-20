# Authentication Setup

## GitHub OAuth with Supabase

This app uses Supabase for authentication with GitHub as the OAuth provider.

### Setup Steps

1. **Supabase Configuration**

   - Your `.env.local` file should already contain the Supabase credentials
   - Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

2. **GitHub OAuth Setup in Supabase**

   - Go to your Supabase Dashboard
   - Navigate to Authentication > Providers
   - Enable GitHub provider
   - Add your GitHub OAuth App credentials:
     - Client ID: From your GitHub OAuth App
     - Client Secret: From your GitHub OAuth App
   - Set Redirect URL to: `https://your-project-ref.supabase.co/auth/v1/callback`

3. **GitHub OAuth App Setup**
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App or use existing one
   - Set Authorization callback URL to: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

### Features Implemented

- ✅ GitHub OAuth sign-in/sign-out
- ✅ User profile display with avatar
- ✅ Authentication state management
- ✅ Protected routes (ready for future implementation)
- ✅ Repository scope requested for GitHub access

### Next Steps

After authentication is working, we'll add:

- User profile completion flow
- GitHub PAT collection and vaulting
- Repository management
- Ledger file operations

### Testing

1. Start the development server: `npm run dev`
2. Click "Sign in with GitHub" in the header
3. Complete GitHub OAuth flow
4. Verify user profile appears in header dropdown
5. Test sign out functionality
