import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../client";
import { deckKeys } from "../decks";
import type { SyncDto } from "../dto";
import { toSyncResult } from "../mappers";
import { studyKeys } from "../study";

export function useSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => request<SyncDto>("/sync", { method: "POST" }).then(toSyncResult),
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: deckKeys.all }),
        qc.invalidateQueries({ queryKey: studyKeys.all }),
      ]),
  });
}
