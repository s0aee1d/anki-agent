import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Access } from "../../domain";
import { request } from "../client";
import type { AuthStateDto } from "../dto";
import { toAccess } from "../mappers";

export const authKeys = { status: ["auth", "status"] as const };

export const useAccess = () =>
  useQuery({
    queryKey: authKeys.status,
    queryFn: () => request<AuthStateDto>("/auth/status").then(toAccess),
    retry: false,
    refetchInterval: (q) => (q.state.data?.status === "pending" ? 3000 : false),
  });

export function useRequestAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => request<AuthStateDto>("/auth/request", { method: "POST" }).then(toAccess),
    onSuccess: (data) => qc.setQueryData<Access>(authKeys.status, data),
  });
}
