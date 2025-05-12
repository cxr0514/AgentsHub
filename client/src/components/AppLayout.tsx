import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Skip this layout for the auth page and use its own specialized layout
  if (location === '/auth') {
    return <>{children}</>;
  }

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
      
      {/* Main content */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
}