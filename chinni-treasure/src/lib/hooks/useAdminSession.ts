"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthMe } from "@/src/lib/hooks/useAdminData";

export function useAdminSession() {
  const router = useRouter();
  const authQuery = useAuthMe();

  const authenticated =
    authQuery.isSuccess && authQuery.data?.authenticated === true;
  const authLoading = authQuery.isPending;
  const shouldRedirect = authQuery.isSuccess && !authQuery.data.authenticated;

  useEffect(() => {
    if (shouldRedirect || authQuery.error) {
      router.push("/admin/login");
    }
  }, [shouldRedirect, authQuery.error, router]);

  return {
    authenticated,
    authLoading,
    ready: !authLoading && (authenticated || shouldRedirect),
  };
}
