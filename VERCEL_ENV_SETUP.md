# Vercel Environment Variables Setup

## Required Environment Variables

To deploy this app to Vercel, you need to set the following environment variables in your Vercel project settings:

### 1. Supabase Configuration

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` - Your Supabase anon/public key

### 2. How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key_here
```

### 3. GitHub OAuth Setup

Make sure your GitHub OAuth App is configured with the correct callback URL:

- **Authorization callback URL**: `https://your-project-ref.supabase.co/auth/v1/callback`

### 4. Supabase GitHub Provider Setup

In your Supabase dashboard:

1. Go to Authentication → Providers
2. Enable GitHub provider
3. Add your GitHub OAuth App credentials:
   - **Client ID**: From your GitHub OAuth App
   - **Client Secret**: From your GitHub OAuth App

## Build Fix Applied

The build error has been fixed by making the Supabase client initialization lazy, so it won't fail during the build process when environment variables aren't available.

## Testing

After setting up the environment variables:

1. Redeploy your Vercel project
2. The build should complete successfully
3. Authentication should work on the live site
