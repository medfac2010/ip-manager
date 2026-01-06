import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Monitor,
  Users,
  Building2,
  LogOut,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const links = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      roles: ["super_admin", "admin"]
    },
    {
      href: "/pcs",
      label: "PCs Management",
      icon: Monitor,
      roles: ["super_admin", "admin"]
    },
    {
      href: "/users",
      label: "Users",
      icon: Users,
      roles: ["super_admin", "admin"]
    },
    {
      href: "/establishments",
      label: "Establishments",
      icon: Building2,
      roles: ["super_admin"]
    },
    {
      href: "/profile",
      label: "Profile",
      icon: Settings,
      roles: ["super_admin", "admin", "user"]
    }
  ];

  const filteredLinks = links.filter(link =>
    link.roles.includes(user.role)
  );

  return (
    <div className="flex h-screen w-64 flex-col bg-card border-r border-border shadow-2xl">
      <div className="flex h-16 items-center px-6 border-b border-border/50">
        <Monitor className="h-6 w-6 text-primary mr-2" />
        <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          IP Manager
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3">
        <nav className="space-y-1">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border/50 bg-secondary/30">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user.username}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}
