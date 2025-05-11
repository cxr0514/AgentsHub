import { Link, useLocation } from "wouter";
import { Home, Search, BarChart2, FileText, Bookmark } from "lucide-react";

const Sidebar = () => {
  const [location] = useLocation();
  
  const navigationItems = [
    { icon: <Home className="h-5 w-5" />, label: "Dashboard", path: "/" },
    { icon: <Search className="h-5 w-5" />, label: "Property Search", path: "/search" },
    { icon: <BarChart2 className="h-5 w-5" />, label: "Market Analysis", path: "/market" },
    { icon: <FileText className="h-5 w-5" />, label: "Reports", path: "/reports" },
    { icon: <Bookmark className="h-5 w-5" />, label: "Saved Properties", path: "/saved" },
  ];
  
  const recentSearches = [
    "San Francisco, CA - 3bd",
    "Austin, TX - Condos",
    "Chicago, IL - Multi-family"
  ];
  
  return (
    <div className="hidden md:block bg-white border-r border-gray-200 w-64 flex-shrink-0 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
        <nav className="space-y-1">
          {navigationItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div className={`flex items-center space-x-3 px-3 py-2 rounded-md cursor-pointer ${
                location === item.path 
                  ? 'bg-blue-500 text-white font-medium' 
                  : 'hover:bg-gray-100'
              }`}>
                {item.icon}
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </nav>
        
        <h2 className="text-lg font-semibold mt-8 mb-4">Recent Searches</h2>
        <div className="space-y-2">
          {recentSearches.map((search, index) => (
            <div 
              key={index} 
              className="block px-3 py-2 hover:bg-gray-100 rounded-md text-sm cursor-pointer"
            >
              {search}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
