import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertPC, type PC } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function usePCs(establishmentId?: number) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryKey = [api.pcs.list.path, establishmentId ? String(establishmentId) : 'all'];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const url = new URL(api.pcs.list.path, window.location.origin);
      if (establishmentId) {
        url.searchParams.set("establishmentId", String(establishmentId));
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to fetch PCs");
      return api.pcs.list.responses[200].parse(await res.json());
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPC) => {
      const res = await fetch(api.pcs.create.path, {
        method: api.pcs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create PC");
      return api.pcs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pcs.list.path] });
      // Also invalidate stats as counts change
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({
        title: "Success",
        description: "PC added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertPC>) => {
      const url = buildUrl(api.pcs.update.path, { id });
      const res = await fetch(url, {
        method: api.pcs.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update PC");
      return api.pcs.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pcs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({
        title: "Success",
        description: "PC updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.pcs.delete.path, { id });
      const res = await fetch(url, {
        method: api.pcs.delete.method,
      });
      if (!res.ok) throw new Error("Failed to delete PC");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pcs.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      toast({
        title: "Deleted",
        description: "PC removed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    pcs: query.data ?? [],
    isLoading: query.isLoading,
    createPC: createMutation.mutateAsync,
    updatePC: updateMutation.mutateAsync,
    deletePC: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
