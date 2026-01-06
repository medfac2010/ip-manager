import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertEstablishment } from "@shared/routes";
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
      if (!res.ok) throw new Error("Failed to create establishment");
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

  return {
    establishments: query.data ?? [],
    isLoading: query.isLoading,
    createEstablishment: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
