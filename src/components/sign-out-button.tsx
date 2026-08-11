"use client";

import { LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, type ButtonProps } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type SignOutButtonProps = Pick<ButtonProps, "className" | "size" | "variant">;

export function SignOutButton({
  className,
  size,
  variant = "secondary",
}: SignOutButtonProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);

    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={handleSignOut}
      disabled={isLoading}
    >
      <LogOut className="size-4" />
      {isLoading ? "Signing out..." : "Sign out"}
    </Button>
  );
}
