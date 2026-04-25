"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SessionUser } from "@/lib/auth";

type SessionData = SessionUser & { permissions: string[] };

export function useSession() {
  const { data, isLoading } = useQuery<SessionData | null>({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      const json = await res.json();
      return json.data;
    },
    staleTime: 5 * 60 * 1000, // 5 min
    retry: false,
  });

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: !!data,
  };
}

export function useLogout() {
  const queryClient = useQueryClient();

  return async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    queryClient.setQueryData(["session"], null);
    window.location.href = "/login";
  };
}
