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
      <aside className="w-64 bg-[#071224] border-r border-[#0f1d31] h-screen flex flex-col">
        <div className="p-6 border-b border-[#0f1d31]">
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6 text-[#FF7A00]" />
            <h1 className="text-xl font-bold text-white">Real Estate Pro</h1>
          </div>
        </div>

        <nav className="p-4 flex-1">
          <div className="space-y-1">
            <p className="text-sm text-slate-400 font-medium px-2 py-1.5">Main</p>
            <Link href="/" className="flex items-center space-x-2 px-2 py-1.5 rounded-md bg-[#0f1d31] text-white">
              <Home className="h-4 w-4 text-[#FF7A00]" />
              <span>Dashboard</span>
            </Link>
            <Link href="/properties" className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-slate-400 hover:bg-[#0f1d31] hover:text-white">
              <Building2 className="h-4 w-4" />
              <span>Properties</span>
            </Link>
            <Link href="/search" className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-slate-400 hover:bg-[#0f1d31] hover:text-white">
              <Search className="h-4 w-4" />
              <span>Property Search</span>
            </Link>
            <Link href="/market-analysis" className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-slate-400 hover:bg-[#0f1d31] hover:text-white">
              <BarChart4 className="h-4 w-4" />
              <span>Market Analysis</span>
            </Link>
            <Link href="/reports" className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-slate-400 hover:bg-[#0f1d31] hover:text-white">
              <ClipboardList className="h-4 w-4" />
              <span>Reports</span>
            </Link>
          </div>

          <PermissionGuard
            permission={Permission.MANAGE_API_KEYS}
            fallback={null}
          >
            <div className="mt-6 space-y-1">
              <p className="text-sm text-slate-400 font-medium px-2 py-1.5">Administration</p>
              <Link href="/settings" className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-slate-400 hover:bg-[#0f1d31] hover:text-white">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
              <Link href="/api-keys" className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-slate-400 hover:bg-[#0f1d31] hover:text-white">
                <Key className="h-4 w-4" />
                <span>API Keys</span>
              </Link>
            </div>
          </PermissionGuard>
        </nav>

        <div className="p-4 border-t border-[#0f1d31]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-[#FF7A00]/10 flex items-center justify-center">
                <span className="text-sm font-medium text-[#FF7A00]">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.username}</p>
                <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="text-slate-400 hover:text-white hover:bg-[#0f1d31]"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome, {user?.fullName || user?.username}</h1>
          <p className="text-slate-400">Here's an overview of your real estate toolkit</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#050e1d] border border-[#0f1d31] rounded-lg p-6 text-white">
            <Building2 className="h-10 w-10 text-[#FF7A00] mb-4" />
            <h2 className="text-xl font-bold mb-2 text-white">Property Comparison</h2>
            <p className="text-slate-400 mb-4">
              Compare property data and analyze key metrics to make informed decisions.
            </p>
            <Button variant="outline" className="w-full border-[#0f1d31] bg-[#050e1d] text-white hover:bg-[#071224] hover:text-[#FF7A00]" asChild>
              <Link href="/properties">View Properties</Link>
            </Button>
          </div>

          <div className="bg-[#050e1d] border border-[#0f1d31] rounded-lg p-6 text-white">
            <BarChart4 className="h-10 w-10 text-[#FF7A00] mb-4" />
            <h2 className="text-xl font-bold mb-2 text-white">Market Analysis</h2>
            <p className="text-slate-400 mb-4">
              Explore market trends, price data, and investment opportunities.
            </p>
            <Button variant="outline" className="w-full border-[#0f1d31] bg-[#050e1d] text-white hover:bg-[#071224] hover:text-[#FF7A00]" asChild>
              <Link href="/market-analysis">View Analysis</Link>
            </Button>
          </div>

          <div className="bg-[#050e1d] border border-[#0f1d31] rounded-lg p-6 text-white">
            <ClipboardList className="h-10 w-10 text-[#FF7A00] mb-4" />
            <h2 className="text-xl font-bold mb-2 text-white">Reports Generator</h2>
            <p className="text-slate-400 mb-4">
              Create professional property reports with customizable templates.
            </p>
            <Button variant="outline" className="w-full border-[#0f1d31] bg-[#050e1d] text-white hover:bg-[#071224] hover:text-[#FF7A00]" asChild>
              <Link href="/reports">Generate Reports</Link>
            </Button>
          </div>
        </div>

        <PermissionGuard permission={Permission.MANAGE_API_KEYS} fallback={null}>
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4 text-white">Admin Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#050e1d] border border-[#0f1d31] rounded-lg p-6 text-white">
                <Key className="h-10 w-10 text-[#FF7A00] mb-4" />
                <h2 className="text-xl font-bold mb-2 text-white">API Key Management</h2>
                <p className="text-slate-400 mb-4">
                  Manage API keys for integrating with external data providers.
                </p>
                <Button variant="outline" className="w-full border-[#0f1d31] bg-[#050e1d] text-white hover:bg-[#071224] hover:text-[#FF7A00]" asChild>
                  <Link href="/api-keys">Manage Keys</Link>
                </Button>
              </div>

              <div className="bg-[#050e1d] border border-[#0f1d31] rounded-lg p-6 text-white">
                <Settings className="h-10 w-10 text-[#FF7A00] mb-4" />
                <h2 className="text-xl font-bold mb-2 text-white">System Settings</h2>
                <p className="text-slate-400 mb-4">
                  Configure application settings and manage user accounts.
                </p>
                <Button variant="outline" className="w-full border-[#0f1d31] bg-[#050e1d] text-white hover:bg-[#071224] hover:text-[#FF7A00]" asChild>
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