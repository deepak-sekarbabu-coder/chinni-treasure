"use client";

import { useMutation } from "@tanstack/react-query";
import { searchTrack } from "@/src/lib/api";
import type { TrackOrdersResponse } from "@/src/lib/api/schemas";

export function useTrackSearch() {
  return useMutation<TrackOrdersResponse, Error, { orderId?: string; phone?: string }>({
    mutationFn: (params) => searchTrack(params),
  });
}
