import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

 type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const utils = trpc.useUtils();
  const meQuery = trpc.adminAuth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const adminLogoutMutation = trpc.adminAuth.logout.useMutation();

  const logout = useCallback(async () => {
    utils.adminAuth.me.setData(undefined, null);
    await adminLogoutMutation.mutateAsync();
  }, [adminLogoutMutation, utils]);

  const state = useMemo(() => ({
    user: meQuery.data ?? null,
    loading: meQuery.isLoading || adminLogoutMutation.isPending,
    error: meQuery.error ?? adminLogoutMutation.error ?? null,
    isAuthenticated: Boolean(meQuery.data),
  }), [meQuery.data, meQuery.error, adminLogoutMutation.error, adminLogoutMutation.isPending, meQuery.isLoading]);

  useEffect(() => {
    if (!redirectOnUnauthenticated || meQuery.isLoading || state.user || typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;
    if (redirectPath) window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, meQuery.isLoading, state.user]);

  return { ...state, refresh: () => meQuery.refetch(), logout };
}
