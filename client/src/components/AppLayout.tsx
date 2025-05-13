import { ReactNode, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import useMobile from "@/hooks/use-mobile";
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
  Calculator,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  LucideIcon
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
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";

// Define a proper interface for menu items
interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
  onClick?: () => void;
}

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [open, setOpen] = useState(false);
  const isMobile = useMobile();
  const [menuCategory, setMenuCategory] = useState<string>("all");
  
  // Skip this layout for the auth page and use its own specialized layout
  if (location === '/auth') {
    return <>{children}</>;
  }

  // Simplified menu items by category for better organization
  const menuCategories: Record<string, MenuItem[]> = {
    main: [
      { icon: Home, label: 'Dashboard', path: '/' },
      { icon: Building2, label: 'Properties', path: '/properties' },
      { icon: Search, label: 'Search', path: '/search' },
    ],
    analysis: [
      { icon: LineChart, label: 'Market Analysis', path: '/market-analysis' },
      { icon: Brain, label: 'AI Insights', path: '/ai-market-analysis' },
    ],
    tools: [
      { icon: FileText, label: 'CMA Reports', path: '/cma-report' },
      { icon: BarChart2, label: 'Comp Matching', path: '/comp-matching' },
    ],
    more: [
      { icon: Map, label: 'Map View', path: '/map-visualization' },
      { icon: Calculator, label: 'Calculators', path: '/financial-calculators' },
      { icon: FileSpreadsheet, label: 'Property Analyzer', path: '/property-analyzer' },
      { icon: FileText, label: 'Reports', path: '/reports' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ]
  };
  
  // Add API Keys to more menu and as a standalone menu item for admin users
  if (user?.role === 'admin') {
    menuCategories.more.push({ icon: Key, label: 'API Keys', path: '/api-keys' });
    // Add to tools category for more visibility
    menuCategories.tools.push({ icon: Key, label: 'API Keys', path: '/api-keys' });
  }
  
  // Primary menu items for desktop navigation (only the most important ones)
  const primaryMenuItems: MenuItem[] = [
    ...menuCategories.main,
    ...menuCategories.analysis,
    ...menuCategories.tools,
  ];
  
  // All menu items for dropdown and mobile navigation
  const allMenuItems: MenuItem[] = [
    ...primaryMenuItems,
    ...menuCategories.more
  ];

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };
  
  // Function to get current menu category items
  const getCurrentMenuItems = () => {
    if (menuCategory === "all") {
      return allMenuItems;
    }
    return menuCategories[menuCategory as keyof typeof menuCategories] || allMenuItems;
  };
  
  // For logged-in users, apply the new consistent design to all pages
  return (
    <div className="relative min-h-screen bg-[#071224] text-white overflow-hidden">
      {/* Background gradient effects - optimized for mobile */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -left-16 -bottom-16 sm:-left-24 sm:-bottom-24 w-64 sm:w-96 h-64 sm:h-96 rounded-full bg-gradient-to-r from-[#0a1b32] to-[#061020] opacity-30"></div>
        <div className="absolute right-0 bottom-0 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] rounded-full bg-gradient-to-l from-[#0d1728] to-[#050d1c] opacity-30"></div>
        <div className="absolute right-1/3 bottom-1/3 w-40 sm:w-64 h-40 sm:h-64 rounded-full bg-gradient-to-r from-[#081526] to-[#040c1b] opacity-20"></div>
      </div>
      
      {/* Top Navigation Bar - mobile optimized */}
      <header className="sticky top-0 z-30 w-full bg-[#050e1d] border-b border-[#0f1d31]">
        <div className="container mx-auto flex items-center justify-between h-16 px-2 sm:px-4">
          <div className="flex items-center gap-2">
            {/* Mobile Menu Trigger with Enhanced Mobile Menu */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="text-[#FF7A00]">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-xs border-r border-[#0f1d31] bg-[#050e1d] p-0 overflow-y-auto">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-[#0f1d31] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="text-[#FF7A00] text-xl">⌂</div>
                      <h2 className="text-xl font-semibold">
                        <span>Real</span>
                        <span className="text-[#FF7A00] mx-1">Estate</span>
                        <span>Pro</span>
                      </h2>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-[#FF7A00]"
                      onClick={() => setOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  {/* Mobile Category Navigation */}
                  <div className="flex overflow-x-auto p-2 gap-2 border-b border-[#0f1d31] no-scrollbar">
                    {Object.entries({
                      main: 'Main',
                      analysis: 'Analysis',
                      tools: 'Tools',
                      more: 'More'
                    }).map(([category, label]) => (
                      <Button
                        key={category}
                        variant={menuCategory === category ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "rounded-full text-xs whitespace-nowrap",
                          menuCategory === category 
                            ? "bg-[#FF7A00] hover:bg-[#FF7A00]/90" 
                            : "border-[#0f1d31] text-white"
                        )}
                        onClick={() => setMenuCategory(category)}
                      >
                        {label}
                      </Button>
                    ))}
                    <Button
                      variant={menuCategory === "all" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "rounded-full text-xs whitespace-nowrap",
                        menuCategory === "all" 
                          ? "bg-[#FF7A00] hover:bg-[#FF7A00]/90" 
                          : "border-[#0f1d31] text-white"
                      )}
                      onClick={() => setMenuCategory("all")}
                    >
                      All
                    </Button>
                  </div>
                  
                  {/* Mobile Navigation Items */}
                  <nav className="flex-1 py-4 overflow-y-auto">
                    <ul className="space-y-1 px-2">
                      {getCurrentMenuItems().map((item: { path: string, icon: any, label: string }) => (
                        <li key={item.path}>
                          <div
                            className={cn(
                              "flex items-center gap-3 px-3 py-3 rounded-md cursor-pointer",
                              location === item.path 
                                ? "bg-[#FF7A00]/10 text-[#FF7A00]" 
                                : "text-white hover:bg-[#071224]"
                            )}
                            onClick={() => {
                              setOpen(false);
                              window.location.href = item.path;
                            }}
                          >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            <span className="line-clamp-1">{item.label}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </nav>
                  
                  {/* User Info & Logout in Mobile Menu */}
                  <div className="p-4 border-t border-[#0f1d31]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF9832] flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {user?.username?.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user?.username}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                      </div>
                    </div>
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

            {/* Logo - Responsive */}
            <div className="flex items-center gap-2 text-xl font-bold tracking-tighter cursor-pointer" onClick={() => window.location.href = "/"}>
              <div className="text-[#FF7A00] text-2xl">⌂</div>
              <div className="hidden xs:block">
                <span>Real</span>
                <span className="text-[#FF7A00] mx-1">Estate</span>
                <span>Pro</span>
              </div>
              <div className="xs:hidden">RE<span className="text-[#FF7A00]">P</span></div>
            </div>
          </div>

          {/* Desktop Navigation - Streamlined with fewer primary items */}
          <nav className="hidden lg:flex items-center space-x-1 overflow-x-auto no-scrollbar">
            {primaryMenuItems.map((item: { path: string, icon: any, label: string }) => (
              <div
                key={item.path}
                className={cn(
                  "flex items-center gap-2 px-2 py-2 rounded-md text-sm font-medium cursor-pointer whitespace-nowrap",
                  location === item.path 
                    ? "bg-[#FF7A00]/10 text-[#FF7A00]" 
                    : "text-white hover:bg-[#071224]"
                )}
                onClick={() => window.location.href = item.path}
              >
                <span>{item.label}</span>
              </div>
            ))}
            
            {/* More Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className={cn(
                  "flex items-center gap-2 px-2 py-2 rounded-md text-sm font-medium cursor-pointer whitespace-nowrap",
                  menuCategories.more.some(item => item.path === location)
                    ? "bg-[#FF7A00]/10 text-[#FF7A00]" 
                    : "text-white hover:bg-[#071224]"
                )}>
                  <span>More</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#050e1d] border border-[#0f1d31] text-white">
                <DropdownMenuLabel>More Options</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#0f1d31]" />
                {menuCategories.more.map((item) => (
                  <DropdownMenuItem 
                    key={item.path}
                    className={cn(
                      "cursor-pointer bg-[#050e1d] text-white hover:bg-[#071224]",
                      location === item.path ? "text-[#FF7A00]" : ""
                    )}
                    onClick={() => window.location.href = item.path}
                  >
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Tablet Navigation - Simplified */}
          <nav className="hidden md:flex lg:hidden items-center space-x-1">
            {menuCategories.main.map((item) => (
              <div
                key={item.path}
                className={cn(
                  "flex items-center gap-2 px-2 py-2 rounded-md text-sm font-medium cursor-pointer",
                  location === item.path 
                    ? "bg-[#FF7A00]/10 text-[#FF7A00]" 
                    : "text-white hover:bg-[#071224]"
                )}
                onClick={() => window.location.href = item.path}
              >
                <span>{item.label}</span>
              </div>
            ))}
          </nav>

          {/* User Menu - Mobile Optimized */}
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
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#0f1d31]" />
              <DropdownMenuItem className="cursor-pointer bg-[#050e1d] text-white hover:bg-[#071224]" onClick={handleLogout}>
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#050e1d] border-t border-[#0f1d31]">
          <div className="flex justify-around items-center h-16">
            {[
              { icon: Home, label: 'Home', path: '/' },
              { icon: Building2, label: 'Properties', path: '/properties' },
              { icon: LineChart, label: 'Analysis', path: '/market-analysis' },
              { icon: Menu, label: 'Menu', path: '#menu', onClick: () => setOpen(true) }
            ].map((item: MenuItem) => (
              <div
                key={item.path}
                className={cn(
                  "flex flex-col items-center justify-center w-20 py-1",
                  (location === item.path && item.path !== '#menu') 
                    ? "text-[#FF7A00]" 
                    : "text-white"
                )}
                onClick={() => item.onClick ? item.onClick() : window.location.href = item.path}
              >
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Main content - mobile padding adjustments */}
      <main className={cn(
        "relative z-0 container mx-auto px-3 sm:px-4 py-4 sm:py-6",
        isMobile && "mb-16" // Add bottom margin for mobile bottom nav
      )}>
        {children}
      </main>
    </div>
  );
}