import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !adminKey) {
    throw new Error("Supabase admin environment variables are missing");
  }

  return createClient(supabaseUrl, adminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }

  if (error && typeof error === "object") {
    return {
      ...error,
    };
  }

  return { message: String(error) };
}

function isAuthorized(request: Request) {
  const expectedToken = process.env.UPDATE_API_TOKEN;
  if (!expectedToken) {
    throw new Error("UPDATE_API_TOKEN is not configured");
  }

  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  return token === expectedToken;
}

export async function GET() {
  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from("update")
      .select("id, updated_at")
      .eq("id", 1)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch update row";

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getAdminClient();
    const timestamp = new Date().toISOString();

    const { data, error } = await supabase
      .from("update")
      .update({ updated_at: timestamp })
      .eq("id", 1)
      .select("id, updated_at")
      .single();

    if (!error && data) {
      return NextResponse.json({ ok: true, step: "update", data });
    }

    const { data: insertedData, error: insertError } = await supabase
      .from("update")
      .insert({ id: 1, updated_at: timestamp })
      .select("id, updated_at")
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          ok: false,
          step: "insert",
          updateError: error ? formatError(error) : null,
          insertError: formatError(insertError),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, step: "insert", data: insertedData });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        step: "catch",
        error: formatError(error),
      },
      { status: 500 }
    );
  }
}
