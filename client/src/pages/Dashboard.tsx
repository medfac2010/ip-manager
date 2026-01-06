import { useStats } from "@/hooks/use-stats";
import { useAuth } from "@/hooks/use-auth";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Loader2, ShieldCheck, Monitor, Server, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

export default function Dashboard() {
  const { stats, isLoading } = useStats();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Aggregate stats for super_admin, or filter for admin
  const displayStats = user?.role === 'admin' 
    ? stats.filter(s => s.establishmentId === user.establishmentId)
    : stats;

  const totalPCs = displayStats.reduce((acc, curr) => acc + curr.totalPcs, 0);
  const totalServers = displayStats.reduce((acc, curr) => acc + curr.serverCount, 0);
  const protectedPCs = displayStats.reduce((acc, curr) => acc + curr.protectedPcs, 0);
  const vulnerablePCs = totalPCs - protectedPCs;

  const chartData = displayStats.map(s => ({
    name: s.establishmentName,
    Total: s.totalPcs,
    Protected: s.protectedPcs,
    Servers: s.serverCount
  }));

  const pieData = [
    { name: 'Protected', value: protectedPCs },
    { name: 'Vulnerable', value: vulnerablePCs },
  ];

  const exportStats = () => {
    const ws = XLSX.utils.json_to_sheet(displayStats);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statistics");
    XLSX.writeFile(wb, "ip_manager_stats.xlsx");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1">Network status and statistics</p>
        </div>
        <Button 
          onClick={exportStats}
          variant="outline" 
          className="gap-2 border-primary/20 text-primary hover:bg-primary/5"
        >
          Export Report
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total PCs", value: totalPCs, icon: Monitor, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Servers", value: totalServers, icon: Server, color: "text-purple-500", bg: "bg-purple-500/10" },
          { title: "Protected", value: protectedPCs, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { title: "Vulnerable", value: vulnerablePCs, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10" },
        ].map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <h3 className="text-3xl font-bold mt-2">{card.value}</h3>
              </div>
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border p-6 rounded-xl shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-6">PCs by Establishment</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Protected" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border p-6 rounded-xl shadow-sm"
        >
          <h3 className="text-lg font-semibold mb-6">Security Coverage</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ec4899'} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-muted-foreground">Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span className="text-sm text-muted-foreground">Vulnerable</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
