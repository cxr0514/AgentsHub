import { Link } from 'wouter';
import { ChevronLeft, FileSpreadsheet, LightbulbIcon } from 'lucide-react';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { PropertyAnalyzer } from '@/components/PropertyAnalyzer';
import { Separator } from '@/components/ui/separator';

export default function PropertyAnalyzerPage() {
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
              <BreadcrumbPage>Property Analyzer</BreadcrumbPage>
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
          <h1 className="text-3xl font-bold text-[#071224]">Property Investment Analyzer</h1>
        </div>
        <p className="text-muted-foreground">
          Analyze any property as an investment with our AI-powered tool. Get insights on market value, rental potential, ROI estimates, and more.
        </p>
      </header>
      
      <div className="grid grid-cols-1 gap-4 mb-8">
        <div className="bg-gradient-to-br from-[#071224] to-[#0c2348] text-white rounded-lg p-5 shadow-md">
          <div className="flex flex-col md:flex-row md:items-start gap-4">
            <div className="rounded-full bg-white/10 w-10 h-10 flex-shrink-0 flex items-center justify-center">
              <LightbulbIcon className="h-5 w-5 text-[#FF7A00]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Investment Analysis</h3>
              <p className="text-sm text-gray-300 mb-4">
                Our advanced AI evaluates properties based on multiple factors including location value, market trends, rental potential, comparable properties, and projected appreciation.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                <div className="bg-white/10 p-3 rounded-md">
                  <h4 className="font-medium text-sm mb-1">Market Value Assessment</h4>
                  <p className="text-xs text-gray-300">Analysis of fair market value based on location and comparables</p>
                </div>
                <div className="bg-white/10 p-3 rounded-md">
                  <h4 className="font-medium text-sm mb-1">ROI Calculation</h4>
                  <p className="text-xs text-gray-300">Estimated rental income, cap rate, and cash flow potential</p>
                </div>
                <div className="bg-white/10 p-3 rounded-md">
                  <h4 className="font-medium text-sm mb-1">Actionable Recommendations</h4>
                  <p className="text-xs text-gray-300">Clear buy, pass, or negotiate recommendation with reasoning</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-[#050e1d] rounded-lg shadow-md border border-[#0f1d31] p-6">
        <PropertyAnalyzer />
      </div>
      
      <div className="mt-8">
        <Separator className="my-8" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#FF7A00]" />
            <h3 className="text-lg font-semibold text-white">Need more detailed analysis?</h3>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="border-[#0f1d31] hover:bg-[#0f1d31] text-slate-300">
              <Link href="/financial-calculators">Financial Calculators</Link>
            </Button>
            <Button asChild className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white">
              <Link href="/ai-market-analysis">AI Market Analysis</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}