import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Home, 
  Search, 
  Building2, 
  LineChart, 
  FileText, 
  Settings, 
  Key, 
  LogOut,
  Menu,
  X,
  BarChart2,
  Sparkles,
  Brain,
  Map,
  Calculator
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [open, setOpen] = useState(false);
  
  // Skip this layout for the auth page and use its own specialized layout
  if (location === '/auth') {
    return <>{children}</>;
  }

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Building2, label: 'Properties', path: '/properties' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Search, label: 'ATTOM Search', path: '/attom-search' },
    { icon: LineChart, label: 'Market Analysis', path: '/market-analysis' },
    { icon: Map, label: 'Map Visualization', path: '/map-visualization' },
    { icon: Brain, label: 'AI Market Analysis', path: '/ai-market-analysis' },
    { icon: BarChart2, label: 'Compare Properties', path: '/property-comparison' },
    { icon: Calculator, label: 'Calculators', path: '/financial-calculators' },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  // Only show API Keys for admin users
  if (user?.role === 'admin') {
    menuItems.push({ icon: Key, label: 'API Keys', path: '/api-keys' });
  }

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  // For logged-in users, apply the new consistent design to all pages
  return (
    <div className="relative min-h-screen bg-[#071224] text-white overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-gradient-to-r from-[#0a1b32] to-[#061020] opacity-30"></div>
        <div className="absolute right-0 bottom-0 w-[800px] h-[800px] rounded-full bg-gradient-to-l from-[#0d1728] to-[#050d1c] opacity-30"></div>
        <div className="absolute right-1/3 bottom-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-[#081526] to-[#040c1b] opacity-20"></div>
      </div>
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-[#050e1d] border-b border-[#0f1d31]">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            {/* Mobile Menu Trigger */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" className="text-[#FF7A00]">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-r border-[#0f1d31] bg-[#050e1d] p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-[#0f1d31]">
                    <h2 className="text-xl font-semibold">Menu</h2>
                  </div>
                  <nav className="flex-1 py-4">
                    <ul className="space-y-1 px-2">
                      {menuItems.map((item) => (
                        <li key={item.path}>
                          <div
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer",
                              location === item.path 
                                ? "bg-[#FF7A00]/10 text-[#FF7A00]" 
                                : "text-white"
                            )}
                            onClick={() => {
                              setOpen(false);
                              window.location.href = item.path;
                            }}
                          >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="p-4 border-t border-[#0f1d31]">
                    <Button 
                      variant="default" 
                      className="w-full flex items-center gap-2 bg-[#FF7A00]"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <div className="flex items-center gap-1 text-xl font-bold tracking-tighter cursor-pointer" onClick={() => window.location.href = "/"}>
              <div className="text-[#FF7A00] text-2xl">⌂</div>
              <div>Prop<span className="text-[#FF7A00]">Invest</span>AI</div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => (
              <div
                key={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer",
                  location === item.path 
                    ? "bg-[#FF7A00]/10 text-[#FF7A00]" 
                    : "text-white"
                )}
                onClick={() => window.location.href = item.path}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            ))}
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 text-white">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF9832] flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {user?.username?.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="hidden md:inline-block">{user?.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#050e1d] border border-[#0f1d31] text-white">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#0f1d31]" />
              <DropdownMenuItem className="cursor-pointer bg-[#050e1d] text-white hover:bg-[#071224]" onClick={() => window.location.href = "/settings"}>
                <Settings className="mr-2 h-4 w-4 text-[#FF7A00]" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#0f1d31]" />
              <DropdownMenuItem className="cursor-pointer bg-[#050e1d] text-white hover:bg-[#071224]" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4 text-[#FF7A00]" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Main content */}
      <main className="relative z-0 container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}