import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CompMatchingEngine from "../components/CompMatchingEngine";
import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import { ArrowLeft, FileDown, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link } from "wouter";

const CMAGenerator = () => {
  const [subjectPropertyId, setSubjectPropertyId] = useState<number | null>(null);
  const [selectedComps, setSelectedComps] = useState<Property[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  
  // Fetch properties for selection
  const { data: properties, isLoading } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return response.json();
    }
  });
  
  // Handle when comps are selected in the CompMatchingEngine
  const handleCompsSelected = (comps: Property[]) => {
    setSelectedComps(comps);
    
    // Automatically scroll to the report section
    document.getElementById('report-section')?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Generate PDF report
  const generateReport = async () => {
    if (!subjectPropertyId || selectedComps.length === 0) {
      toast({
        title: "Missing data",
        description: "Please select a subject property and at least one comparable property",
        variant: "destructive"
      });
      return;
    }
    
    setIsGeneratingReport(true);
    
    try {
      // Create a new report
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 1, // Default user ID (would use authenticated user in real app)
          title: "Comparative Market Analysis Report",
          properties: JSON.stringify([subjectPropertyId, ...selectedComps.map(comp => comp.id)]),
          description: "CMA Report generated on " + new Date().toLocaleDateString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create report');
      }
      
      const report = await response.json();
      
      toast({
        title: "Report created",
        description: "CMA Report has been generated successfully",
        variant: "default"
      });
      
      // Navigate to the report (would use react-router in a real app)
      // For now, we'll just log the report ID
      console.log('Report created with ID:', report.id);
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Report generation failed",
        description: "There was a problem creating the CMA report",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CMA Report Generator</h1>
          <p className="text-muted-foreground">
            Create detailed Comparative Market Analysis reports
          </p>
        </div>
        <Link to="/reports">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Select Subject Property</CardTitle>
          <CardDescription>
            Choose the property you want to analyze
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {properties?.slice(0, 6).map((property: Property) => (
                <div 
                  key={property.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    subjectPropertyId === property.id 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-gray-400"
                  }`}
                  onClick={() => setSubjectPropertyId(property.id)}
                >
                  <div className="font-medium">{property.address}</div>
                  <div className="text-sm text-muted-foreground">
                    {property.city}, {property.state}
                  </div>
                  <div className="flex justify-between mt-2">
                    <div className="text-sm">
                      {property.bedrooms} beds • {property.bathrooms} baths
                    </div>
                    <div className="font-medium">${Number(property.price).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {subjectPropertyId && (
        <Card>
          <CardHeader>
            <CardTitle>Comp Matching Engine</CardTitle>
            <CardDescription>
              Find and select comparable properties for your analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompMatchingEngine 
              propertyId={subjectPropertyId} 
              onCompsSelected={handleCompsSelected}
            />
          </CardContent>
        </Card>
      )}
      
      {selectedComps.length > 0 && (
        <Card id="report-section">
          <CardHeader>
            <CardTitle>CMA Report</CardTitle>
            <CardDescription>
              Analysis based on {selectedComps.length} selected comparable properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-3">
                  <h3 className="text-lg font-semibold mb-2">Comparable Properties Summary</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-right">Count</th>
                          <th className="px-4 py-2 text-right">Min Price</th>
                          <th className="px-4 py-2 text-right">Max Price</th>
                          <th className="px-4 py-2 text-right">Avg Price</th>
                          <th className="px-4 py-2 text-right">Avg Price/SqFt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Active Properties */}
                        <tr className="border-b">
                          <td className="px-4 py-2 text-left font-medium">Active</td>
                          <td className="px-4 py-2 text-right">
                            {selectedComps.filter(p => p.status === "Active").length}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {selectedComps.filter(p => p.status === "Active").length > 0 
                              ? "$" + Math.min(...selectedComps
                                .filter(p => p.status === "Active")
                                .map(p => Number(p.price))).toLocaleString() 
                              : "N/A"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {selectedComps.filter(p => p.status === "Active").length > 0 
                              ? "$" + Math.max(...selectedComps
                                .filter(p => p.status === "Active")
                                .map(p => Number(p.price))).toLocaleString() 
                              : "N/A"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {selectedComps.filter(p => p.status === "Active").length > 0 
                              ? "$" + Math.round(selectedComps
                                .filter(p => p.status === "Active")
                                .reduce((sum, p) => sum + Number(p.price), 0) / 
                                selectedComps.filter(p => p.status === "Active").length
                              ).toLocaleString()
                              : "N/A"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {selectedComps.filter(p => p.status === "Active").length > 0 
                              ? "$" + Math.round(selectedComps
                                .filter(p => p.status === "Active")
                                .reduce((sum, p) => sum + Number(p.pricePerSqft || 0), 0) / 
                                selectedComps.filter(p => p.status === "Active").length
                              ).toLocaleString()
                              : "N/A"}
                          </td>
                        </tr>
                        
                        {/* Pending Properties */}
                        <tr className="border-b">
                          <td className="px-4 py-2 text-left font-medium">Pending</td>
                          <td className="px-4 py-2 text-right">
                            {selectedComps.filter(p => p.status === "Pending").length}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {selectedComps.filter(p => p.status === "Pending").length > 0 
                              ? "$" + Math.min(...selectedComps
                                .filter(p => p.status === "Pending")
                                .map(p => Number(p.price))).toLocaleString() 
                              : "N/A"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {selectedComps.filter(p => p.status === "Pending").length > 0 
                              ? "$" + Math.max(...selectedComps
                                .filter(p => p.status === "Pending")
                                .map(p => Number(p.price))).toLocaleString() 
                              : "N/A"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {selectedComps.filter(p => p.status === "Pending").length > 0 
                              ? "$" + Math.round(selectedComps
                                .filter(p => p.status === "Pending")
                                .reduce((sum, p) => sum + Number(p.price), 0) / 
                                selectedComps.filter(p => p.status === "Pending").length
                              ).toLocaleString()
                              : "N/A"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {selectedComps.filter(p => p.status === "Pending").length > 0 
                              ? "$" + Math.round(selectedComps
                                .filter(p => p.status === "Pending")
                                .reduce((sum, p) => sum + Number(p.pricePerSqft || 0), 0) / 
                                selectedComps.filter(p => p.status === "Pending").length
                              ).toLocaleString()
                              : "N/A"}
                          </td>
                        </tr>
                        
                        {/* Sold Properties */}
                        <tr className="border-b">
                          <td className="px-4 py-2 text-left font-medium">Sold</td>
                          <td className="px-4 py-2 text-right">
                            {selectedComps.filter(p => p.status === "Sold").length}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {selectedComps.filter(p => p.status === "Sold").length > 0 
                              ? "$" + Math.min(...selectedComps
                                .filter(p => p.status === "Sold")
                                .map(p => Number(p.price))).toLocaleString() 
                              : "N/A"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {selectedComps.filter(p => p.status === "Sold").length > 0 
                              ? "$" + Math.max(...selectedComps
                                .filter(p => p.status === "Sold")
                                .map(p => Number(p.price))).toLocaleString() 
                              : "N/A"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {selectedComps.filter(p => p.status === "Sold").length > 0 
                              ? "$" + Math.round(selectedComps
                                .filter(p => p.status === "Sold")
                                .reduce((sum, p) => sum + Number(p.price), 0) / 
                                selectedComps.filter(p => p.status === "Sold").length
                              ).toLocaleString()
                              : "N/A"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {selectedComps.filter(p => p.status === "Sold").length > 0 
                              ? "$" + Math.round(selectedComps
                                .filter(p => p.status === "Sold")
                                .reduce((sum, p) => sum + Number(p.pricePerSqft || 0), 0) / 
                                selectedComps.filter(p => p.status === "Sold").length
                              ).toLocaleString()
                              : "N/A"}
                          </td>
                        </tr>
                        
                        {/* Total/Average */}
                        <tr className="bg-gray-50 font-medium">
                          <td className="px-4 py-2 text-left">All Comps</td>
                          <td className="px-4 py-2 text-right">{selectedComps.length}</td>
                          <td className="px-4 py-2 text-right">
                            {"$" + Math.min(...selectedComps.map(p => Number(p.price))).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {"$" + Math.max(...selectedComps.map(p => Number(p.price))).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {"$" + Math.round(selectedComps.reduce((sum, p) => sum + Number(p.price), 0) / 
                              selectedComps.length
                            ).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right">
                            {"$" + Math.round(selectedComps.reduce((sum, p) => sum + Number(p.pricePerSqft || 0), 0) / 
                              selectedComps.length
                            ).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              {/* ARV & MAO Calculations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-secondary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">ARV (After Repair Value)</CardTitle>
                    <CardDescription>
                      Estimated value of property after improvements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      ${Math.round(selectedComps
                        .filter(p => p.status === "Sold")
                        .reduce((sum, p) => sum + Number(p.price), 0) / 
                        Math.max(1, selectedComps.filter(p => p.status === "Sold").length)
                      ).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on average of sold comparable properties
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-secondary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">MAO (Maximum Allowable Offer)</CardTitle>
                    <CardDescription>
                      70% of ARV minus repair costs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-primary">
                      ${Math.round(selectedComps
                        .filter(p => p.status === "Sold")
                        .reduce((sum, p) => sum + Number(p.price), 0) / 
                        Math.max(1, selectedComps.filter(p => p.status === "Sold").length) * 0.7
                      ).toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on 70% of ARV (repair costs not included)
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button
                onClick={generateReport}
                disabled={isGeneratingReport}
                className="bg-primary hover:bg-primary/90"
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="h-4 w-4 mr-2" />
                    Generate CMA Report
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CMAGenerator;