import "server-only";

import { createClient } from "@supabase/supabase-js";

function getAdminEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY for admin operations.",
    );
  }

  return { supabaseSecretKey, supabaseUrl };
}

export function createAdminClient() {
  const { supabaseSecretKey, supabaseUrl } = getAdminEnv();

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
