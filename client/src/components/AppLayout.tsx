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
  X
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
    { icon: LineChart, label: 'Market Analysis', path: '/market-analysis' },
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
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background gradient effects */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="animate-wave absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-gradient-to-r from-teal-400 to-teal-200 opacity-10"></div>
        <div className="animate-wave-slow absolute right-0 bottom-0 w-[800px] h-[800px] rounded-full bg-gradient-to-l from-indigo-500 via-purple-500 to-pink-400 opacity-10"></div>
        <div className="animate-wave-slower absolute right-1/3 bottom-1/3 w-64 h-64 rounded-full bg-gradient-to-r from-fuchsia-400 to-purple-400 opacity-5"></div>
        
        {/* Particle effects */}
        {Array.from({ length: 20 }).map((_, index) => (
          <div 
            key={index} 
            className="animate-pulse absolute w-1 h-1 rounded-full bg-white opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${3 + Math.random() * 7}s`
            }}
          ></div>
        ))}
      </div>
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full bg-transparent backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            {/* Mobile Menu Trigger */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 border-r border-white/10 bg-black/90 backdrop-blur-xl p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-white/10">
                    <h2 className="text-xl font-semibold">Menu</h2>
                  </div>
                  <nav className="flex-1 py-4">
                    <ul className="space-y-1 px-2">
                      {menuItems.map((item) => (
                        <li key={item.path}>
                          <Link href={item.path}>
                            <a
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                                location === item.path 
                                  ? "bg-white/10 text-white" 
                                  : "hover:bg-white/5 text-white/70 hover:text-white"
                              )}
                              onClick={() => setOpen(false)}
                            >
                              <item.icon className="h-5 w-5" />
                              <span>{item.label}</span>
                            </a>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  <div className="p-4 border-t border-white/10">
                    <Button 
                      variant="destructive" 
                      className="w-full flex items-center gap-2"
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
            <Link href="/">
              <a className="text-xl font-semibold tracking-tighter">
                PropInvest<span className="text-blue-400">AI</span>
              </a>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {menuItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location === item.path 
                      ? "bg-white/10 text-white" 
                      : "hover:bg-white/5 text-white/70 hover:text-white"
                  )}
                >
                  {item.label}
                </a>
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">
                    {user?.username?.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="hidden md:inline-block">{user?.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-black/90 backdrop-blur-xl border border-white/10 text-white">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="cursor-pointer" onClick={() => window.location.href = "/settings"}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
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