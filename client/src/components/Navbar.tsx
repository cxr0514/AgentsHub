import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import useMobile from "@/hooks/use-mobile";

const Navbar = () => {
  const [location] = useLocation();
  const isMobile = useMobile();
  
  const navItems = [
    { label: "Dashboard", path: "/" },
    { label: "Properties", path: "/properties" },
    { label: "Rental Properties", path: "/rental" },
    { label: "Market Analysis", path: "/market-analysis" },
    { label: "AI Insights", path: "/ai-insights" },
    { label: "CMA Reports", path: "/cma" },
    { label: "Comp Matching", path: "/comp-matching" }
  ];
  
  return (
    <header className="bg-primary text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link to="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Home className="h-8 w-8" />
              <h1 className="text-xl font-semibold">RealComp</h1>
            </div>
          </Link>
        </div>
        
        {!isMobile && (
          <div className="flex items-center space-x-4">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <span className={`${location === item.path ? 'bg-[#1A1F2E] text-[#F2801E] rounded-lg px-3 py-1' : 'hover:text-accent'} transition-colors ${item.path === '/' ? 'font-medium' : ''} cursor-pointer`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        )}
        
        <div className="flex items-center space-x-3">
          {!isMobile && (
            <Button variant="default" className="bg-accent hover:bg-accent/80">
              Upgrade Plan
            </Button>
          )}
          
          <div className="relative">
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-accent text-white">
              <span className="font-medium text-sm">JD</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
