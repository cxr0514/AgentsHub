import { useState } from "react";
import { Property, MarketData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, FileText, Printer, Download } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PropertyReportGeneratorProps {
  property?: Property;
  properties?: Property[];
  marketData?: MarketData;
  includeComparables?: boolean;
}

const PropertyReportGenerator = ({ 
  property,
  properties = [],
  marketData,
  includeComparables = true
}: PropertyReportGeneratorProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [sections, setSections] = useState({
    propertyDetails: true,
    financialAnalysis: true,
    marketData: true,
    comparableProperties: includeComparables,
    locationInfo: true,
    images: true
  });

  const handleSectionToggle = (section: keyof typeof sections) => {
    setSections({
      ...sections,
      [section]: !sections[section]
    });
  };

  const formatCurrency = (value?: number): string => {
    if (value === undefined) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date?: Date | string): string => {
    if (!date) return "N/A";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const generateReport = async () => {
    if (!property && properties.length === 0) {
      toast({
        title: "No property data",
        description: "There is no property data available to generate a report.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add header with logo (placeholder)
      doc.setFillColor(7, 18, 36); // #071224
      doc.rect(0, 0, 210, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Real Estate Pro", 15, 15);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Property Report", 150, 15);

      // Add generation date
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text(`Generated: ${formatDate(new Date())}`, 15, 30);

      let yPosition = 40;

      // Single property report
      if (property) {
        // Property details section
        if (sections.propertyDetails) {
          doc.setTextColor(7, 18, 36);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text("Property Details", 15, yPosition);
          yPosition += 8;

          doc.setDrawColor(7, 18, 36);
          doc.line(15, yPosition, 195, yPosition);
          yPosition += 8;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          doc.setTextColor(60, 60, 60);

          const details = [
            ["Address", property.address],
            ["City", property.city],
            ["State", property.state],
            ["Zip Code", property.zipCode],
            ["Price", formatCurrency(property.price)],
            ["Beds", property.beds?.toString() || "N/A"],
            ["Baths", property.baths?.toString() || "N/A"],
            ["Square Feet", property.squareFeet?.toString() || "N/A"],
            ["Year Built", property.yearBuilt?.toString() || "N/A"],
            ["Property Type", property.propertyType || "N/A"],
            ["Status", property.status || "N/A"]
          ];

          autoTable(doc, {
            startY: yPosition,
            head: [],
            body: details,
            theme: 'plain',
            styles: {
              fontSize: 10,
              cellPadding: 2,
            },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 40 },
              1: { cellWidth: 'auto' }
            }
          });

          yPosition = (doc as any).lastAutoTable.finalY + 10;
        }

        // Financial analysis section
        if (sections.financialAnalysis) {
          doc.setTextColor(7, 18, 36);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text("Financial Analysis", 15, yPosition);
          yPosition += 8;

          doc.setDrawColor(7, 18, 36);
          doc.line(15, yPosition, 195, yPosition);
          yPosition += 8;

          // Sample financial analysis
          const propertyPrice = property.price || 300000;
          const downPayment = propertyPrice * 0.2; // 20% down payment
          const loanAmount = propertyPrice - downPayment;
          const interestRate = 6.5; // 6.5% interest rate
          const loanTerm = 30; // 30 years
          const monthlyRate = interestRate / 100 / 12;
          const numberOfPayments = loanTerm * 12;
          
          // Monthly payment formula: P * (r * (1 + r)^n) / ((1 + r)^n - 1)
          const monthlyPayment = loanAmount * 
            (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
          
          const totalPayment = monthlyPayment * numberOfPayments;
          const totalInterest = totalPayment - loanAmount;

          const financialData = [
            ["Property Price", formatCurrency(propertyPrice)],
            ["Down Payment (20%)", formatCurrency(downPayment)],
            ["Loan Amount", formatCurrency(loanAmount)],
            ["Interest Rate", interestRate + "%"],
            ["Loan Term", loanTerm + " years"],
            ["Monthly Payment", formatCurrency(monthlyPayment)],
            ["Total Interest", formatCurrency(totalInterest)],
            ["Total Payment", formatCurrency(totalPayment)]
          ];

          autoTable(doc, {
            startY: yPosition,
            head: [],
            body: financialData,
            theme: 'plain',
            styles: {
              fontSize: 10,
              cellPadding: 2,
            },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 60 },
              1: { cellWidth: 'auto' }
            }
          });

          yPosition = (doc as any).lastAutoTable.finalY + 10;
        }

        // Market data section
        if (sections.marketData && marketData) {
          // Check if we need a new page
          if (yPosition > 230) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setTextColor(7, 18, 36);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text("Market Data", 15, yPosition);
          yPosition += 8;

          doc.setDrawColor(7, 18, 36);
          doc.line(15, yPosition, 195, yPosition);
          yPosition += 8;

          const marketDataArray = [
            ["Location", `${marketData.city}, ${marketData.state}`],
            ["Average Price", formatCurrency(marketData.averagePrice)],
            ["Median Price", formatCurrency(marketData.medianPrice)],
            ["Price Per Sq Ft", formatCurrency(marketData.pricePerSquareFoot)],
            ["Inventory", marketData.inventory?.toString() || "N/A"],
            ["Days on Market", marketData.daysOnMarket?.toString() || "N/A"],
            ["Year-over-Year Change", (marketData.yearOverYearChange ? marketData.yearOverYearChange + "%" : "N/A")],
            ["Market Trend", marketData.marketTrend || "N/A"]
          ];

          autoTable(doc, {
            startY: yPosition,
            head: [],
            body: marketDataArray,
            theme: 'plain',
            styles: {
              fontSize: 10,
              cellPadding: 2,
            },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 60 },
              1: { cellWidth: 'auto' }
            }
          });

          yPosition = (doc as any).lastAutoTable.finalY + 10;
        }

        // Location info
        if (sections.locationInfo) {
          // Check if we need a new page
          if (yPosition > 230) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setTextColor(7, 18, 36);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.text("Location Information", 15, yPosition);
          yPosition += 8;

          doc.setDrawColor(7, 18, 36);
          doc.line(15, yPosition, 195, yPosition);
          yPosition += 8;

          // Add some dummy location data
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(60, 60, 60);
          doc.text("• School District: Local School District", 20, yPosition);
          yPosition += 6;
          doc.text("• Nearby Amenities: Parks, Shopping Centers, Restaurants", 20, yPosition);
          yPosition += 6;
          doc.text("• Transportation: Bus Routes, Highway Access", 20, yPosition);
          yPosition += 14;
        }
      } 
      // Multiple properties comparison report
      else if (properties.length > 0) {
        // Property comparison section
        doc.setTextColor(7, 18, 36);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Property Comparison", 15, yPosition);
        yPosition += 8;

        doc.setDrawColor(7, 18, 36);
        doc.line(15, yPosition, 195, yPosition);
        yPosition += 8;

        // Create comparison table
        const headers = [["Address", "Price", "Beds", "Baths", "Sq Ft", "Year Built"]];
        
        const data = properties.map(p => [
          p.address,
          formatCurrency(p.price),
          p.beds?.toString() || "N/A",
          p.baths?.toString() || "N/A",
          p.squareFeet?.toString() || "N/A",
          p.yearBuilt?.toString() || "N/A"
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: headers,
          body: data,
          theme: 'striped',
          headStyles: {
            fillColor: [7, 18, 36],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          styles: {
            fontSize: 9,
            cellPadding: 3,
          }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 10;
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
        doc.text('© Real Estate Pro', 15, 285);
      }

      // Save PDF
      doc.save(`property-report-${new Date().getTime()}.pdf`);

      toast({
        title: "Report generated",
        description: "Your property report has been generated and downloaded.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error generating report",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="bg-[#071224] text-white rounded-t-lg">
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 mr-2 text-[#FF7A00]" />
          Property Report Generator
        </CardTitle>
        <CardDescription className="text-gray-300">
          Create a downloadable PDF report with property details
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Include in Report:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="property-details" 
                checked={sections.propertyDetails} 
                onCheckedChange={() => handleSectionToggle('propertyDetails')} 
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="property-details"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Property Details
                </Label>
                <p className="text-xs text-muted-foreground">
                  Address, price, beds, baths, etc.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox 
                id="financial-analysis" 
                checked={sections.financialAnalysis} 
                onCheckedChange={() => handleSectionToggle('financialAnalysis')} 
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="financial-analysis"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Financial Analysis
                </Label>
                <p className="text-xs text-muted-foreground">
                  Mortgage details, ROI, investment metrics
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox 
                id="market-data" 
                checked={sections.marketData} 
                onCheckedChange={() => handleSectionToggle('marketData')} 
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="market-data"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Market Data
                </Label>
                <p className="text-xs text-muted-foreground">
                  Trends, comps, local market statistics
                </p>
              </div>
            </div>

            {includeComparables && (
              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="comparable-properties" 
                  checked={sections.comparableProperties} 
                  onCheckedChange={() => handleSectionToggle('comparableProperties')} 
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="comparable-properties"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Comparable Properties
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Similar properties in the area
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-2">
              <Checkbox 
                id="location-info" 
                checked={sections.locationInfo} 
                onCheckedChange={() => handleSectionToggle('locationInfo')} 
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="location-info"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Location Information
                </Label>
                <p className="text-xs text-muted-foreground">
                  Schools, amenities, transportation
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox 
                id="images" 
                checked={sections.images} 
                onCheckedChange={() => handleSectionToggle('images')} 
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="images"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Property Images
                </Label>
                <p className="text-xs text-muted-foreground">
                  Photos and floor plans
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {(!property && properties.length === 0) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No data available</AlertTitle>
            <AlertDescription>
              There is no property data available to generate a report.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button 
            onClick={generateReport} 
            disabled={isGenerating || (!property && properties.length === 0)}
            className="bg-[#071224] hover:bg-[#0f1d31] text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Download Report"}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={generateReport} 
            disabled={isGenerating || (!property && properties.length === 0)}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyReportGenerator;