import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Sorry, something went wrong.
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {params?.error ? (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Code error: {params.error}
                  </p>
                  <div className="mt-4 p-3 bg-muted/30 rounded-md">
                    <p className="text-xs text-muted-foreground">
                      <strong>Debug info:</strong>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Error: {params.error}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This usually means the OAuth callback didn't receive the
                      expected authorization code.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Check that the redirect URL is properly configured in
                      Supabase.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  An unspecified error occurred.
                </p>
              )}
              <div className="pt-4">
                <a href="/" className="text-sm text-primary hover:underline">
                  ← Back to home
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
