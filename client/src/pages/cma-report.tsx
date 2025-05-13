import { Link } from 'wouter';
import { ChevronLeft, FileText, Info } from 'lucide-react';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { CMAReportGenerator } from '@/components/CMAReportGenerator';
import { Separator } from '@/components/ui/separator';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export default function CMAReportPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl bg-[#050e1d] text-white -mx-4 -my-6 p-10 min-h-screen">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" className="text-slate-400 hover:text-white">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-slate-400" />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white">CMA Report Generator</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-slate-400 hover:text-white hover:bg-[#0f1d31]">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">CMA Report Generator</h1>
        </div>
        <p className="text-slate-400">
          Create professional Comparative Market Analysis reports with customizable templates, branding, and detailed property comparisons.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-[#071224] to-[#0c2348] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#FF7A00]" />
              Professional Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300">
              Create branded, detailed reports for clients with customizable templates and formats.
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-[#071224] to-[#0c2348] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#FF7A00]" />
              Accurate Comparisons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300">
              Compare properties with detailed adjustments for features, conditions, and locations.
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-[#071224] to-[#0c2348] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#FF7A00]" />
              Multiple Export Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300">
              Export as PDF documents or Excel spreadsheets for easy sharing and distribution.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-[#050e1d] rounded-lg shadow-md border border-[#0f1d31] p-0 mb-8 text-white">
        <CardContent className="p-0">
          <CMAReportGenerator />
        </CardContent>
      </Card>
      
      <Card className="mt-8 bg-[#050e1d] rounded-lg shadow-md border border-[#0f1d31] text-white">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <Info className="h-5 w-5 text-[#FF7A00]" />
            About Comparative Market Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">
            A Comparative Market Analysis (CMA) is a detailed report that analyzes similar properties (comps) in a specific area to determine the fair market value of a subject property. Real estate professionals use CMAs to help sellers set listing prices and to help buyers make competitive offers. A comprehensive CMA takes into account factors such as property size, features, condition, location, and recent sales data.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="text-sm font-medium mb-2 text-white">For Sellers</h3>
              <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                <li>Helps determine an accurate listing price</li>
                <li>Provides market insights on comparable properties</li>
                <li>Highlights your property's unique features and value</li>
                <li>Gives you confidence in pricing discussions</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-white">For Buyers</h3>
              <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                <li>Ensures you're making a fair offer</li>
                <li>Provides negotiation leverage with data-backed insights</li>
                <li>Helps identify potential value opportunities</li>
                <li>Provides confidence in your investment decision</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}