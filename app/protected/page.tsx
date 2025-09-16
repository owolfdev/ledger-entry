import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { InfoIcon, BookOpen } from "lucide-react";
import { FetchDataSteps } from "@/components/tutorial/fetch-data-steps";
import { Button } from "@/components/ui/button";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          This is a protected page that you can only see as an authenticated
          user
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Basic Info</h3>
            <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
              {JSON.stringify(
                {
                  id: user.id,
                  email: user.email,
                  created_at: user.created_at,
                  last_sign_in_at: user.last_sign_in_at,
                },
                null,
                2
              )}
            </pre>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">
              User Metadata (includes GitHub token)
            </h3>
            <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
              {JSON.stringify(user.user_metadata, null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">App Metadata</h3>
            <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
              {JSON.stringify(user.app_metadata, null, 2)}
            </pre>
          </div>
        </div>
      </div>
      <div>
        <h2 className="font-bold text-2xl mb-4">Next steps</h2>
        <FetchDataSteps />
      </div>

      <div>
        <h2 className="font-bold text-2xl mb-4">Ledger Setup</h2>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Create a personal ledger to track your finances using plain text
            files stored in your GitHub repository.
          </p>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link href="/ledger-setup">
              <BookOpen className="h-4 w-4 mr-2" />
              Setup Ledger
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
