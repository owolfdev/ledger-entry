"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Github } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

interface UserData {
  email?: string;
  user_metadata?: {
    user_name?: string;
    name?: string;
    avatar_url?: string;
  };
}

export function GitHubAuthButton() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user: userData },
        } = await supabase.auth.getUser();
        setUser(userData);
      } catch (error) {
        console.error("Error getting user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4" />
      </Button>
    );
  }

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline">
          <a href="/auth/login">Sign in</a>
        </Button>
        <Button asChild size="sm" variant="default">
          <a href="/auth/sign-up">Sign up</a>
        </Button>
      </div>
    );
  }

  const githubUsername =
    user.user_metadata?.user_name || user.user_metadata?.name || "User";
  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName = githubUsername;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={24}
              height={24}
              className="h-6 w-6 rounded-full"
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Github className="h-4 w-4" />
            </div>
          )}
          <span className="hidden sm:inline">{displayName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
