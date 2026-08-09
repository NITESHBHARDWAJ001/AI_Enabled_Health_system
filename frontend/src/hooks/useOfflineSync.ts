import { useCallback, useEffect, useRef } from "react";
import * as aiApi from "@/api/ai";
import { getPendingScreenings, removePendingScreening } from "@/lib/offlineDb";
import { toast } from "@/store/toastStore";

/**
 * Flushes any screenings queued in IndexedDB (saved while offline) to the backend,
 * on mount and whenever the browser regains connectivity. Mount once near the app root.
 */
export function useOfflineSync() {
  const syncingRef = useRef(false);

  const flush = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    try {
      const pending = await getPendingScreenings();
      if (pending.length === 0) return;

      let synced = 0;
      for (const item of pending) {
        try {
          await aiApi.submitScreening({
            patientId: item.patientId,
            inputSnapshot: item.inputSnapshot,
            output: item.output as aiApi.ScreeningResult,
          });
          if (item.id !== undefined) await removePendingScreening(item.id);
          synced += 1;
        } catch {
          // still offline or server rejected it — leave queued, try again next time
          break;
        }
      }

      if (synced > 0) {
        toast({
          title: "Offline screenings synced",
          description: `${synced} saved screening${synced > 1 ? "s" : ""} uploaded.`,
          variant: "success",
        });
      }
    } finally {
      syncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [flush]);
}
