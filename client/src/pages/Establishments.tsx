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
import { Plus, Building2, Trash2, Pencil, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Establishments() {
  const { user } = useAuth();
  const { establishments, createEstablishment, deleteEstablishment, updateEstablishment, isLoading, isDeleting } = useEstablishments(
    user?.role === 'super_admin' ? undefined : user?.establishmentId
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEstablishment, setEditingEstablishment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEstablishments = establishments.filter((est: any) =>
    est.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const form = useForm<InsertEstablishment>({
    resolver: zodResolver(insertEstablishmentSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (data: InsertEstablishment) => {
    try {
      if (editingEstablishment) {
        await updateEstablishment({ ...editingEstablishment, ...data });
      } else {
        await createEstablishment(data);
      }
      setIsDialogOpen(false);
      setEditingEstablishment(null);
      form.reset({ name: "" });
    } catch (e) {
      // toast handled in hook
    }
  };

  const handleEdit = (est: any) => {
    setEditingEstablishment(est);
    form.reset({ name: est.name });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet établissement?")) {
      console.log(`Bouton supprimer cliqué pour l'ID: ${id}`);
      try {
        await deleteEstablishment(id);
        console.log("Suppression réussie");
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Establishments</h1>
          <p className="text-muted-foreground mt-1">Manage locations and branches</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingEstablishment(null);
              form.reset({ name: "" });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-primary to-primary/90">
              <Plus className="h-4 w-4" /> Ajouter un Établissement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEstablishment ? "Modifier l'Établissement" : "Ajouter un Nouvel Établissement"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'Établissement</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Siège social" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">
                  {editingEstablishment ? "Mettre à jour" : "Créer"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un établissement..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Chargement...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Date d'ajout</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEstablishments.map((est) => (
                <TableRow key={est.id}>
                  <TableCell className="font-medium">#{est.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{est.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(est.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(est)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Modifier</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isDeleting}
                        onClick={() => handleDelete(est.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEstablishments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Aucun établissement trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
