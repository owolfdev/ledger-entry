import { createAdminClient } from "@/lib/supabase/admin";

export async function runWeeklyJob() {
  const startedAt = new Date().toISOString();
  const tableName = process.env.SUPABASE_WEEKLY_UPDATE_TABLE ?? "update";
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from(tableName)
    .insert({ updated_at: startedAt })
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Failed to insert weekly update record into "${tableName}": ${error.message}`,
    );
  }

  return {
    insertedRecord: data,
    startedAt,
    summary: `Inserted weekly audit record into "${tableName}".`,
    tableName,
  };
}
