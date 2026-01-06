import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import PCs from "@/pages/PCs";
import Users from "@/pages/Users";
import Establishments from "@/pages/Establishments";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

function ProtectedRoute({
  component: Component,
  allowedRoles
}: {
  component: React.ComponentType,
  allowedRoles?: string[]
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!user) {
    return <Login />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <NotFound />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route path="/">
        <ProtectedRoute
          component={Dashboard}
          allowedRoles={["super_admin", "admin"]}
        />
      </Route>

      <Route path="/pcs">
        <ProtectedRoute
          component={PCs}
          allowedRoles={["super_admin", "admin"]}
        />
      </Route>

      <Route path="/users">
        <ProtectedRoute
          component={Users}
          allowedRoles={["super_admin", "admin"]}
        />
      </Route>

      <Route path="/establishments">
        <ProtectedRoute
          component={Establishments}
          allowedRoles={["super_admin"]}
        />
      </Route>

      <Route path="/profile">
        <ProtectedRoute
          component={Profile}
          allowedRoles={["super_admin", "admin", "user"]}
        />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
