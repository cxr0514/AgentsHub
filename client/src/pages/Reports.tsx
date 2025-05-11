import { useState } from "react";
import { Helmet } from "react-helmet";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { generatePropertyComparisonReport } from "@/lib/pdfGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Property, Report } from "@shared/schema";
import { FileText, Download, Trash2, PlusCircle, Calendar, BarChart2 } from "lucide-react";
import { Link } from "wouter";

// Mock user ID - in a real app this would come from auth
const userId = 1;

const Reports = () => {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newReportTitle, setNewReportTitle] = useState("");
  const [newReportDescription, setNewReportDescription] = useState("");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>([]);
  const [showNewReportDialog, setShowNewReportDialog] = useState(false);

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: [`/api/users/${userId}/reports`],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/reports`);
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      return await response.json();
    }
  });

  const { data: properties } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return await response.json();
    }
  });

  const createReportMutation = useMutation({
    mutationFn: async (reportData: { userId: number; title: string; description?: string; properties: string }) => {
      return apiRequest('POST', '/api/reports', reportData);
    },
    onSuccess: () => {
      refetch();
      setShowNewReportDialog(false);
      setNewReportTitle("");
      setNewReportDescription("");
      setSelectedPropertyIds([]);
      toast({
        title: "Report created",
        description: "Your new report has been created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create report: ${error}`,
        variant: "destructive"
      });
    }
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      return apiRequest('DELETE', `/api/reports/${reportId}`);
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Report deleted",
        description: "The report has been deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete report: ${error}`,
        variant: "destructive"
      });
    }
  });

  const handleCreateReport = () => {
    if (!newReportTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a report title",
        variant: "destructive"
      });
      return;
    }

    if (selectedPropertyIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one property",
        variant: "destructive"
      });
      return;
    }

    createReportMutation.mutate({
      userId,
      title: newReportTitle,
      description: newReportDescription,
      properties: JSON.stringify(selectedPropertyIds)
    });
  };

  const handleDeleteReport = (reportId: number) => {
    deleteReportMutation.mutate(reportId);
  };

  const handleDownloadReport = async (report: Report) => {
    try {
      // First try to parse properties from the report, if this fails we'll fetch them
      let propertiesToInclude: Property[] = [];
      let reportProperties: number[] = [];
      
      try {
        if (typeof report.properties === 'string') {
          reportProperties = JSON.parse(report.properties);
        } else if (report.properties) {
          reportProperties = report.properties as unknown as number[];
        }
      } catch (parseError) {
        console.warn('Error parsing report properties:', parseError);
      }
      
      // If we have properties data and the properties from the query
      if (reportProperties.length > 0 && properties) {
        propertiesToInclude = properties.filter((property: Property) => 
          reportProperties.includes(property.id)
        );
      }
      
      // If we don't have the properties yet, fetch them
      if (propertiesToInclude.length === 0) {
        const response = await fetch(`/api/reports/${report.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch report details');
        }
        
        const reportData = await response.json();
        propertiesToInclude = reportData.properties || [];
      }
      
      // Generate the PDF report
      const result = await generatePropertyComparisonReport(propertiesToInclude, report.title);
      
      toast({
        title: "Report downloaded",
        description: `Your report "${result.filename}" has been downloaded successfully`
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: `Failed to download report: ${error}`,
        variant: "destructive"
      });
    }
  };

  const togglePropertySelection = (propertyId: number) => {
    if (selectedPropertyIds.includes(propertyId)) {
      setSelectedPropertyIds(selectedPropertyIds.filter(id => id !== propertyId));
    } else {
      setSelectedPropertyIds([...selectedPropertyIds, propertyId]);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Property Reports</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
              <CardFooter>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Property Reports | RealComp - Real Estate Comparison Tool</title>
        <meta name="description" content="Create, view, and manage comprehensive property comparison reports for your real estate analysis." />
      </Helmet>

      <div className="container mx-auto p-4">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Property Reports</h1>
            <p className="text-text-secondary">
              Create and manage property comparison reports
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/cma-generator">
              <Button variant="outline" className="border-accent text-accent hover:bg-accent/10">
                <BarChart2 className="mr-2 h-4 w-4" />
                CMA Generator
              </Button>
            </Link>
            <Dialog open={showNewReportDialog} onOpenChange={setShowNewReportDialog}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Report
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Report</DialogTitle>
                  <DialogDescription>
                    Select properties to include in your comparison report.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="title">Report Title</Label>
                    <Input
                      id="title"
                      value={newReportTitle}
                      onChange={(e) => setNewReportTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={newReportDescription}
                      onChange={(e) => setNewReportDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Select Properties</Label>
                    <div className="border border-border rounded-md mt-2 max-h-60 overflow-y-auto">
                      {properties && properties.length > 0 ? (
                        <div className="divide-y divide-border">
                          {properties.map((property: Property) => (
                            <div 
                              key={property.id} 
                              className={`flex items-center p-3 cursor-pointer hover:bg-muted ${
                                selectedPropertyIds.includes(property.id) ? 'bg-accent/10' : ''
                              }`}
                              onClick={() => togglePropertySelection(property.id)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedPropertyIds.includes(property.id)}
                                onChange={() => {}}
                                className="mr-3"
                              />
                              <div className="flex-1">
                                <div className="font-medium">{property.address}</div>
                                <div className="text-sm text-text-secondary">
                                  {property.city}, {property.state} - ${Number(property.price).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-text-secondary">
                          No properties available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewReportDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateReport}
                    disabled={!newReportTitle || selectedPropertyIds.length === 0}
                  >
                    Create Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {!reports || reports.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-text-secondary opacity-50" />
            <p className="text-text-secondary mb-4">You haven't created any reports yet.</p>
            <Button 
              className="bg-accent hover:bg-accent/90"
              onClick={() => setShowNewReportDialog(true)}
            >
              Create Your First Report
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reports.map((report: Report) => (
              <Card key={report.id}>
                <CardHeader>
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription>
                    <div className="flex items-center text-text-secondary">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {report.description || "Comparison report of selected properties"}
                  </p>
                  <p className="text-sm mt-2">
                    {typeof report.properties === 'string' 
                      ? `${JSON.parse(report.properties).length} properties included` 
                      : Array.isArray(report.properties) 
                        ? `${report.properties.length} properties included`
                        : "Properties included"}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => handleDeleteReport(report.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-accent hover:bg-accent/90"
                    onClick={() => handleDownloadReport(report)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Reports;