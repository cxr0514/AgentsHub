import { Link } from 'wouter';
import { ChevronLeft, BarChart2, Home } from 'lucide-react';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { CompMatchingEngine } from '@/components/CompMatchingEngine';
import { Separator } from '@/components/ui/separator';

export default function CompMatchingPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Comp Matching Engine</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-[#071224]">Comp Matching Engine</h1>
        </div>
        <p className="text-muted-foreground">
          Find, analyze, and adjust comparable properties to determine accurate property valuations.
        </p>
      </header>
      
      <div className="grid grid-cols-1 gap-4 mb-8">
        <div className="bg-gradient-to-br from-[#071224] to-[#0c2348] text-white rounded-lg p-5 shadow-md">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="rounded-full bg-white/10 w-10 h-10 flex-shrink-0 flex items-center justify-center">
              <Home className="h-5 w-5 text-[#FF7A00]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Smart Comparable Property Analysis</h3>
              <p className="text-sm text-gray-300 mb-4">
                Our comp matching engine helps real estate professionals find and analyze comparable properties with powerful filtering, side-by-side comparisons, and customizable adjustment tools.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                <div className="bg-white/10 p-3 rounded-md">
                  <h4 className="font-medium text-sm mb-1">Advanced Filtering</h4>
                  <p className="text-xs text-gray-300">Find comparable properties based on location, size, features, and more</p>
                </div>
                <div className="bg-white/10 p-3 rounded-md">
                  <h4 className="font-medium text-sm mb-1">Detailed Adjustments</h4>
                  <p className="text-xs text-gray-300">Make precise value adjustments based on property differences</p>
                </div>
                <div className="bg-white/10 p-3 rounded-md">
                  <h4 className="font-medium text-sm mb-1">CMA Reporting</h4>
                  <p className="text-xs text-gray-300">Generate comprehensive Comparative Market Analysis reports</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-0 mb-8">
        <CompMatchingEngine />
      </div>
      
      <div className="mt-8">
        <Separator className="my-8" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-[#FF7A00]" />
            <h3 className="text-lg font-semibold">Need more analysis tools?</h3>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/financial-calculators">Financial Calculators</Link>
            </Button>
            <Button asChild className="bg-[#071224] hover:bg-[#0f1d31] text-white">
              <Link href="/property-analyzer">Property Analyzer</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}