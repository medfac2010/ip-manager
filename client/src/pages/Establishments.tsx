import { useEstablishments } from "@/hooks/use-establishments";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEstablishmentSchema, type InsertEstablishment } from "@shared/routes";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Building2 } from "lucide-react";

export default function Establishments() {
  const { establishments, createEstablishment, isLoading } = useEstablishments();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<InsertEstablishment>({
    resolver: zodResolver(insertEstablishmentSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (data: InsertEstablishment) => {
    try {
      await createEstablishment(data);
      setIsDialogOpen(false);
      form.reset();
    } catch (e) {
      // toast handled in hook
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Establishments</h1>
          <p className="text-muted-foreground mt-1">Manage locations and branches</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-primary to-primary/90">
              <Plus className="h-4 w-4" /> Add Establishment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Establishment</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Establishment Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Headquarters" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          establishments.map((est) => (
            <div key={est.id} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{est.name}</h3>
                  <p className="text-xs text-muted-foreground">Added on {new Date(est.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
