import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, UpdateEstablishment, buildUrl, type InsertEstablishment } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useEstablishments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [api.establishments.list.path],
    queryFn: async () => {
      const res = await fetch(api.establishments.list.path);
      if (!res.ok) throw new Error("Failed to fetch establishments");
      return api.establishments.list.responses[200].parse(await res.json());
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertEstablishment) => {
      const res = await fetch(api.establishments.create.path, {
        method: api.establishments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText || "Failed to create establishment" }));
        throw new Error(error.message);
      }
      return api.establishments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.establishments.list.path] });
      toast({
        title: "Success",
        description: "Establishment created successfully",
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
      console.log(`Deleting establishment ${id}...`);
      const res = await fetch(buildUrl(api.establishments.delete.path, { id }), {
        method: api.establishments.delete.method,
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText || "Failed to delete establishment" }));
        console.error("Delete failed:", error);
        throw new Error(error.message);
      }
      console.log("Delete successful");
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.establishments.list.path] });
      toast({
        title: "Success",
        description: "Establishment deleted successfully",
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
    mutationFn: async (data: UpdateEstablishment) => {
      const res = await fetch(buildUrl(api.establishments.update.path, { id: data.id }), {
        method: api.establishments.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText || "Failed to update establishment" }));
        throw new Error(error.message);
      }
      return api.establishments.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.establishments.list.path] });
      toast({
        title: "Success",
        description: "Establishment updated successfully",
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
    establishments: query.data ?? [],
    isLoading: query.isLoading,
    createEstablishment: createMutation.mutateAsync,
    deleteEstablishment: deleteMutation.mutateAsync,
    updateEstablishment: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
