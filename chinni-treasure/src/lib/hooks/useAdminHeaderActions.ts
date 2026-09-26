"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/src/components/ui/ToastProvider";
import { useExportToExcel, useLogout } from "@/src/lib/hooks/useAdminMutations";
import { getErrorMessage } from "@/src/lib/api/client";

export function useAdminHeaderActions() {
  const router = useRouter();
  const { showToast } = useToast();
  const logoutMutation = useLogout();
  const exportMutation = useExportToExcel();

  const handleLogout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Even if logout fails server-side, redirect and clear local state.
    } finally {
      router.push("/admin/login");
    }
  }, [logoutMutation, router]);

  const handleExport = useCallback(async () => {
    try {
      const blob = await exportMutation.mutateAsync();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chinni-treasure-export-${new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Export downloaded successfully", "success");
    } catch (err) {
      console.error("Export failed:", err);
      showToast(getErrorMessage(err, "Failed to export data"), "error");
    }
  }, [exportMutation, showToast]);

  return {
    handleLogout,
    handleExport,
    isLoggingOut: logoutMutation.isPending,
    isExporting: exportMutation.isPending,
  };
}
