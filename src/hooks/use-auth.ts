"use client";

import { useState, useEffect } from "react";
import { User, getCurrentUser, onAuthStateChange } from "@/src/lib/auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    getCurrentUser()
      .then((user) => {
        setUser(user);
        setLoading(false);
      })
      .catch((error) => {
        console.warn("Error getting current user:", error);
        // Don't treat auth session missing as an error
        setUser(null);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
