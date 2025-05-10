import { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useLocation } from "wouter";
import useMobile from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const [location] = useLocation();
  const isMobile = useMobile();
  
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar />
      
      <div className="flex flex-grow overflow-hidden">
        {!isMobile && <Sidebar />}
        
        <div className="flex-grow overflow-y-auto">
          {children}
          
          <footer className="mt-8 text-center text-sm text-text-secondary pb-8">
            <p>© {new Date().getFullYear()} RealComp. All rights reserved. Data provided for informational purposes only.</p>
            <p className="mt-2">All property information shown is from sources believed to be reliable but is subject to verification.</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Layout;
