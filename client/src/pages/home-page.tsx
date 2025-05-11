import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/components/PermissionGuard";
import { Permission } from "@shared/permissions";
import { Link } from "wouter";
import { Building2, Settings, ClipboardList, Key, Search, Home, BarChart4, LogOut } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border h-screen flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Real Estate Pro</h1>
          </div>
        </div>

        <nav className="p-4 flex-1">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground font-medium px-2 py-1.5">Main</p>
            <Link href="/">
              <a className="flex items-center space-x-2 px-2 py-1.5 rounded-md bg-accent text-accent-foreground">
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
              </a>
            </Link>
            <Link href="/properties">
              <a className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                <Building2 className="h-4 w-4" />
                <span>Properties</span>
              </a>
            </Link>
            <Link href="/search">
              <a className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                <Search className="h-4 w-4" />
                <span>Property Search</span>
              </a>
            </Link>
            <Link href="/market-analysis">
              <a className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                <BarChart4 className="h-4 w-4" />
                <span>Market Analysis</span>
              </a>
            </Link>
            <Link href="/reports">
              <a className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                <ClipboardList className="h-4 w-4" />
                <span>Reports</span>
              </a>
            </Link>
          </div>

          <PermissionGuard
            permission={Permission.MANAGE_API_KEYS}
            fallback={null}
          >
            <div className="mt-6 space-y-1">
              <p className="text-sm text-muted-foreground font-medium px-2 py-1.5">Administration</p>
              <Link href="/settings">
                <a className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </a>
              </Link>
              <Link href="/api-keys">
                <a className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                  <Key className="h-4 w-4" />
                  <span>API Keys</span>
                </a>
              </Link>
            </div>
          </PermissionGuard>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{user?.username}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.fullName || user?.username}</h1>
          <p className="text-muted-foreground">Here's an overview of your real estate toolkit</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <Building2 className="h-10 w-10 text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2">Property Comparison</h2>
            <p className="text-muted-foreground mb-4">
              Compare property data and analyze key metrics to make informed decisions.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/properties">View Properties</Link>
            </Button>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <BarChart4 className="h-10 w-10 text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2">Market Analysis</h2>
            <p className="text-muted-foreground mb-4">
              Explore market trends, price data, and investment opportunities.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/market-analysis">View Analysis</Link>
            </Button>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <ClipboardList className="h-10 w-10 text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2">Reports Generator</h2>
            <p className="text-muted-foreground mb-4">
              Create professional property reports with customizable templates.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/reports">Generate Reports</Link>
            </Button>
          </div>
        </div>

        <PermissionGuard permission={Permission.MANAGE_API_KEYS} fallback={null}>
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4">Admin Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <Key className="h-10 w-10 text-primary mb-4" />
                <h2 className="text-xl font-bold mb-2">API Key Management</h2>
                <p className="text-muted-foreground mb-4">
                  Manage API keys for integrating with external data providers.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/api-keys">Manage Keys</Link>
                </Button>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <Settings className="h-10 w-10 text-primary mb-4" />
                <h2 className="text-xl font-bold mb-2">System Settings</h2>
                <p className="text-muted-foreground mb-4">
                  Configure application settings and manage user accounts.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/settings">Manage Settings</Link>
                </Button>
              </div>
            </div>
          </div>
        </PermissionGuard>
      </main>
    </div>
  );
}