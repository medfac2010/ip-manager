import { useState } from "react";
import { usePCs } from "@/hooks/use-pcs";
import { useEstablishments } from "@/hooks/use-establishments";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPcSchema, type InsertPC, type PC, pcTypes } from "@shared/routes";
import { z } from "zod";
import * as XLSX from "xlsx";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Pencil, Download, Server, Monitor, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PCs() {
  const { user } = useAuth();
  const { pcs, createPC, updatePC, deletePC, isLoading, isDeleting } = usePCs(
    user?.role === 'admin' ? user.establishmentId : undefined
  );
  const { establishments } = useEstablishments();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPC, setEditingPC] = useState<PC | null>(null);

  const filteredPCs = pcs.filter(pc =>
    pc.ipAddress.includes(searchTerm) ||
    pc.officeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pc.usersInfo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredPCs);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PCs");
    XLSX.writeFile(wb, "pc_inventory.xlsx");
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Voulez-vous vraiment supprimer cet équipement ?")) {
      console.log(`Bouton supprimer cliqué pour le PC ID: ${id}`);
      try {
        await deletePC(id);
        console.log("Suppression réussie");
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">PC Inventory</h1>
          <p className="text-muted-foreground mt-1">Manage computers and servers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToExcel} className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button onClick={() => { setEditingPC(null); setIsDialogOpen(true); }} className="gap-2 bg-gradient-to-r from-primary to-primary/90">
            <Plus className="h-4 w-4" /> Add Device
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-4">
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by IP, Office, or User..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Office</TableHead>
                <TableHead>User Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : filteredPCs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No devices found.</TableCell>
                </TableRow>
              ) : (
                filteredPCs.map((pc) => (
                  <TableRow key={pc.id} className="hover:bg-secondary/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {pc.type === "Server" ? <Server className="h-4 w-4 text-purple-500" /> :
                          pc.type === "Terminal" ? <Terminal className="h-4 w-4 text-orange-500" /> :
                            <Monitor className="h-4 w-4 text-blue-500" />}
                        <span className="font-medium">{pc.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{pc.ipAddress}</TableCell>
                    <TableCell>{pc.officeName || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={pc.usersInfo || ""}>
                      {pc.usersInfo || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {pc.isIpFiltered && <Badge variant="secondary" className="text-xs">Filtered IP</Badge>}
                        {pc.hasAntivirus && <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200">Protected</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => { setEditingPC(pc); setIsDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={isDeleting}
                          onClick={() => handleDelete(pc.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPC ? "Edit Device" : "Add New Device"}</DialogTitle>
          </DialogHeader>
          <PCForm
            establishmentId={user?.establishmentId}
            establishments={establishments}
            initialData={editingPC}
            onSubmit={async (data) => {
              try {
                if (editingPC) {
                  await updatePC({ id: editingPC.id, ...data });
                } else {
                  await createPC(data);
                }
                setIsDialogOpen(false);
              } catch (e) {
                // Toast handled in hook
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PCForm({
  establishmentId,
  establishments,
  initialData,
  onSubmit
}: {
  establishmentId?: number | null,
  establishments: any[],
  initialData: PC | null,
  onSubmit: (data: InsertPC) => Promise<void>
}) {
  const form = useForm<InsertPC>({
    resolver: zodResolver(insertPcSchema),
    defaultValues: initialData || {
      establishmentId: establishmentId || undefined,
      type: "Mini Server",
      ipAddress: "",
      isIpFiltered: false,
      hasWindows: true,
      hasWindowsLicense: true,
      hasOffice: false,
      hasOfficeLicense: false,
      hasAntivirus: false,
    }
  });

  const watchType = form.watch("type");
  const watchHasAntivirus = form.watch("hasAntivirus");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Only show establishment select if super_admin */}
        {!establishmentId && (
          <FormField
            control={form.control}
            name="establishmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Establishment</FormLabel>
                <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select establishment" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {establishments.map((est) => (
                      <SelectItem key={est.id} value={String(est.id)}>{est.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {pcTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ipAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>IP Address</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="192.168.1.10" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="macAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>MAC Address</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="00:1A:2B:3C:4D:5E" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="officeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Office / Service</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="HR Department" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="usersInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Users Info (Name, Phone)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} placeholder="John Doe - 555-0123" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {(watchType === "Server" || watchType === "Mini Server") && (
          <FormField
            control={form.control}
            name="serverServices"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Server Services</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="FTP, Web, AD..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
          <h4 className="font-medium text-sm text-muted-foreground mb-2">Configuration & Licenses</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="hasWindows"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Windows Installed</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hasWindowsLicense"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Windows Licensed</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hasOffice"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Office Installed</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hasOfficeLicense"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Office Licensed</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isIpFiltered"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>IP Filtered</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hasAntivirus"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Has Antivirus</FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        {watchHasAntivirus && (
          <FormField
            control={form.control}
            name="antivirusName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Antivirus Name</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="Kaspersky, ESET..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" className="w-full">
          {initialData ? "Update Device" : "Add Device"}
        </Button>
      </form>
    </Form>
  );
}
