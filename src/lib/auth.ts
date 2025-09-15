import { supabase } from "@/src/lib/supabase";

export interface User {
  id: string;
  email?: string;
  user_metadata: {
    avatar_url?: string;
    full_name?: string;
    user_name?: string;
  };
}

export const signInWithGitHub = async () => {
  if (!supabase) {
    throw new Error("Supabase client is not initialized");
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      scopes: "repo", // Request repository access
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const signOut = async () => {
  if (!supabase) {
    throw new Error("Supabase client is not initialized");
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (!supabase) {
    console.warn("Supabase client is not initialized");
    return null;
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      // Don't log AuthSessionMissingError as an error - it's normal when not logged in
      if (error.message.includes("Auth session missing")) {
        return null;
      }
      console.error("Error getting current user:", error);
      return null;
    }

    return user as User | null;
  } catch (error) {
    console.warn("Error getting current user:", error);
    return null;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  if (!supabase) {
    console.warn("Supabase client is not initialized");
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user as User | null);
  });
};
