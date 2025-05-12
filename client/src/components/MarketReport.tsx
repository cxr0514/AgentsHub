import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { BarChart4, FileText, Printer, Download, AlertTriangle, Buildings, Home, Building2 } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface MarketReportProps {
  initialLocation?: string;
}

export function MarketReport({ initialLocation = 'Atlanta, GA' }: MarketReportProps) {
  const { toast } = useToast();
  const [location, setLocation] = useState(initialLocation);
  const [propertyType, setPropertyType] = useState<string>('residential');
  
  // Popular locations for the selector
  const popularLocations = [
    'Atlanta, GA',
    'Boston, MA',
    'Chicago, IL',
    'Dallas, TX',
    'Denver, CO',
    'Las Vegas, NV',
    'Los Angeles, CA',
    'Miami, FL',
    'Nashville, TN',
    'New York, NY',
    'Orlando, FL',
    'Phoenix, AZ',
    'San Francisco, CA',
    'Seattle, WA',
    'Austin, TX'
  ];
  
  // Query to fetch market report based on location and property type
  const { data, isLoading, isError, refetch } = useQuery<{ report: string }>({
    queryKey: [`/api/market-analysis/report/${encodeURIComponent(location)}`, { propertyType }],
    enabled: Boolean(location),
  });
  
  const handleLocationChange = (newLocation: string) => {
    setLocation(newLocation);
  };
  
  const handlePropertyTypeChange = (type: string) => {
    setPropertyType(type);
  };
  
  // Function to download report as PDF
  const handleDownloadPDF = () => {
    if (!data?.report) return;
    
    try {
      const doc = new jsPDF();
      
      // Add a title
      doc.setFontSize(18);
      doc.text(`${location} Real Estate Market Report`, 14, 22);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);
      
      // Add report content
      doc.setFontSize(12);
      
      const finalY = doc.autoTable({
        startY: 35,
        head: [['Market Report']],
        body: [[data.report]],
        headStyles: { fillColor: [7, 18, 36], textColor: [255, 255, 255] },
        margin: { top: 35 },
        styles: { overflow: 'linebreak', cellWidth: 'auto' },
        columnStyles: { 0: { cellWidth: 'auto' } },
      });
      
      // Save the PDF
      doc.save(`${location.replace(/,/g, '')}_Market_Report.pdf`);
      
      toast({
        title: "PDF Downloaded",
        description: `${location} market report has been downloaded.`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error Downloading PDF",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Function to print report
  const handlePrint = () => {
    if (!data?.report) return;
    
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups to print the report.",
          variant: "destructive",
        });
        return;
      }
      
      printWindow.document.write(`
        <html>
          <head>
            <title>${location} Market Report</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 30px;
              }
              h1 {
                color: #071224;
                margin-bottom: 10px;
              }
              .date {
                color: #666;
                margin-bottom: 30px;
                font-size: 0.9em;
              }
              .content {
                white-space: pre-line;
              }
              @media print {
                body {
                  margin: 0.5in;
                }
              }
            </style>
          </head>
          <body>
            <h1>${location} Real Estate Market Report</h1>
            <div class="date">Generated on ${new Date().toLocaleDateString()}</div>
            <div class="content">${data.report.replace(/\n/g, '<br>')}</div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
      
    } catch (error) {
      console.error('Error printing report:', error);
      toast({
        title: "Error Printing Report",
        description: "There was an error preparing the report for printing.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl text-[#071224]">Market Report</CardTitle>
            <CardDescription>
              AI-generated comprehensive market analysis
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={location} onValueChange={handleLocationChange}>
              <SelectTrigger className="w-full min-w-[180px]">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {popularLocations.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={propertyType} onValueChange={handlePropertyTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>Residential</span>
                  </div>
                </SelectItem>
                <SelectItem value="commercial">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span>Commercial</span>
                  </div>
                </SelectItem>
                <SelectItem value="multifamily">
                  <div className="flex items-center gap-2">
                    <Buildings className="h-4 w-4" />
                    <span>Multi-Family</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex justify-end gap-2 mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={handlePrint}
            disabled={isLoading || isError || !data}
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={handleDownloadPDF}
            disabled={isLoading || isError || !data}
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </Button>
        </div>
        
        <Card className="border">
          <CardContent className="p-6">
            {isLoading ? (
              // Loading skeleton
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Separator className="my-4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Separator className="my-4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : isError ? (
              // Error state
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Failed to load market report</h3>
                <p className="text-muted-foreground mb-4">
                  There was an error generating the market report.
                </p>
                <Button onClick={() => refetch()}>Try Again</Button>
              </div>
            ) : data?.report ? (
              // Report content
              <div>
                <h3 className="text-xl font-bold mb-4">{location} Market Report</h3>
                <div className="whitespace-pre-line text-sm">
                  {data.report}
                </div>
              </div>
            ) : (
              // Empty state
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No report available</h3>
                <p className="text-muted-foreground mb-4">
                  We couldn't find a market report for this location and property type.
                </p>
                <Button onClick={() => refetch()}>Generate Report</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </CardContent>
      
      <CardFooter className="border-t px-6 py-4">
        <div className="flex items-center w-full text-xs text-muted-foreground">
          <BarChart4 className="h-4 w-4 mr-2 text-[#FF7A00]" />
          <span>
            Data is AI-generated using market indicators and may not reflect the most current market conditions.
            Updated {new Date().toLocaleDateString()}.
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}