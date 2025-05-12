import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Trash2, 
  Plus, 
  BarChart, 
  Home, 
  Calculator, 
  DollarSign, 
  Printer,
  Clock,
  Calendar,
  User,
  Settings,
  ChevronRight,
  Info,
  NotebookPen
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

// Report type definition
interface Report {
  id: number;
  title: string;
  description: string | null;
  properties: any; // The properties data for the report
  userId: number;
  createdAt: string;
}

// Property type definition
interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: string;
  bedrooms: number;
  bathrooms: string;
  squareFeet: string;
  propertyType: string;
  status: string;
  yearBuilt: number;
}

// Report type options
const REPORT_TYPES = [
  { id: "cma", name: "Comparative Market Analysis (CMA)", icon: BarChart },
  { id: "investment", name: "Investment Property Analysis", icon: Calculator },
  { id: "arv", name: "After Repair Value (ARV)", icon: Home },
  { id: "mao", name: "Maximum Allowable Offer (MAO)", icon: DollarSign },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedReportType, setSelectedReportType] = useState("");
  const [newReportTitle, setNewReportTitle] = useState("");
  const [newReportDescription, setNewReportDescription] = useState("");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<number[]>([]);
  const [isCreatingReport, setIsCreatingReport] = useState(false);
  const [activeTab, setActiveTab] = useState("my-reports");
  
  // Fetch user's reports
  const { 
    data: reports, 
    isLoading: isReportsLoading,
    error: reportsError
  } = useQuery({
    queryKey: ['/api/reports'],
    queryFn: async () => {
      if (!user) return [];
      
      const response = await apiRequest('GET', `/api/users/${user.id}/reports`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      return response.json();
    },
    enabled: !!user
  });
  
  // Fetch properties for report creation
  const { 
    data: properties, 
    isLoading: isPropertiesLoading 
  } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/properties?status=Active&limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      
      return response.json();
    }
  });
  
  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (reportData: { 
      title: string, 
      description: string, 
      reportType: string,
      propertyIds: number[]
    }) => {
      if (!user) throw new Error('You must be logged in to create reports');
      
      const response = await apiRequest('POST', '/api/reports', {
        userId: user.id,
        title: reportData.title,
        description: reportData.description,
        properties: {
          type: reportData.reportType,
          propertyIds: reportData.propertyIds
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to create report');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report created",
        description: "Your report has been created successfully.",
      });
      
      // Reset form
      setNewReportTitle("");
      setNewReportDescription("");
      setSelectedReportType("");
      setSelectedPropertyIds([]);
      setIsCreatingReport(false);
      
      // Refetch reports
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
    onError: (error) => {
      toast({
        title: "Error creating report",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Delete report mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await apiRequest('DELETE', `/api/reports/${reportId}`);
      
      if (!response.ok) {
        throw new Error('Failed to delete report');
      }
      
      return reportId;
    },
    onSuccess: (reportId) => {
      toast({
        title: "Report deleted",
        description: "Your report has been deleted successfully.",
      });
      
      // Refetch reports
      queryClient.invalidateQueries({ queryKey: ['/api/reports'] });
    },
    onError: (error) => {
      toast({
        title: "Error deleting report",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  });
  
  // Format price for display
  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(numPrice);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return dateString;
    }
  };
  
  // Toggle property selection for report creation
  const togglePropertySelection = (propertyId: number) => {
    setSelectedPropertyIds(prevIds => {
      if (prevIds.includes(propertyId)) {
        return prevIds.filter(id => id !== propertyId);
      } else {
        return [...prevIds, propertyId];
      }
    });
  };
  
  // Handle report creation
  const handleCreateReport = () => {
    if (!newReportTitle) {
      toast({
        title: "Error",
        description: "Please enter a report title",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedReportType) {
      toast({
        title: "Error",
        description: "Please select a report type",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedPropertyIds.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one property",
        variant: "destructive",
      });
      return;
    }
    
    createReportMutation.mutate({
      title: newReportTitle,
      description: newReportDescription,
      reportType: selectedReportType,
      propertyIds: selectedPropertyIds
    });
  };
  
  // Get report type name from ID
  const getReportTypeName = (typeId: string) => {
    const reportType = REPORT_TYPES.find(type => type.id === typeId);
    return reportType?.name || "Unknown Report Type";
  };
  
  // Get report icon component
  const getReportIcon = (typeId: string) => {
    const reportType = REPORT_TYPES.find(type => type.id === typeId);
    return reportType?.icon || FileText;
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" className="mb-2" asChild>
              <Link href="/" className="flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Reports</h1>
            <p className="text-muted-foreground">Generate and manage property reports</p>
          </div>
          
          <Button onClick={() => setIsCreatingReport(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Report
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8">
            <TabsTrigger value="my-reports">My Reports</TabsTrigger>
            <TabsTrigger value="templates">Report Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-reports">
            {isReportsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : reportsError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-medium text-red-800 mb-2">Failed to load reports</h3>
                <p className="text-red-600">
                  {reportsError instanceof Error ? reportsError.message : 'An unknown error occurred'}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/reports'] })}
                >
                  Retry
                </Button>
              </div>
            ) : reports && reports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report: Report) => {
                  const ReportIcon = getReportIcon(report.properties?.type || "cma");
                  return (
                    <Card key={report.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className="mr-3 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <ReportIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{report.title}</CardTitle>
                              <CardDescription>
                                {getReportTypeName(report.properties?.type || "cma")}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {report.properties?.propertyIds?.length || 0} Properties
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {report.description && (
                          <p className="text-sm text-muted-foreground mb-4">
                            {report.description}
                          </p>
                        )}
                        <div className="text-sm text-muted-foreground">
                          Created {formatDate(report.createdAt)}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between border-t pt-4">
                        <Button variant="outline" asChild>
                          <Link href={`/reports/${report.id}`}>
                            <FileText className="mr-2 h-4 w-4" />
                            View Report
                          </Link>
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="text-destructive"
                            onClick={() => deleteReportMutation.mutate(report.id)}
                            disabled={deleteReportMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#050e1d] border border-[#0f1d31] rounded-lg p-12 text-center text-white">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#FF7A00]/10 flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-[#FF7A00]" />
                </div>
                <h3 className="text-lg font-medium mb-2">No reports yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  You haven't created any reports yet. Create your first report to analyze property data and generate insights.
                </p>
                <Button onClick={() => setIsCreatingReport(true)} className="bg-[#FF7A00]">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Report
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {REPORT_TYPES.map((reportType) => (
                <Card key={reportType.id} className="flex flex-col bg-[#050e1d] border-[#0f1d31] text-white">
                  <CardHeader>
                    <div className="flex items-center">
                      <div className="mr-3 h-10 w-10 rounded-full bg-[#FF7A00]/10 flex items-center justify-center">
                        <reportType.icon className="h-5 w-5 text-[#FF7A00]" />
                      </div>
                      <CardTitle className="text-lg">{reportType.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {reportType.id === "cma" && (
                      <p className="text-sm text-slate-400">
                        Compare properties based on location, features, and market data to determine accurate property values.
                      </p>
                    )}
                    {reportType.id === "investment" && (
                      <p className="text-sm text-slate-400">
                        Analyze potential returns, cash flow, cap rates, and other investment metrics for income properties.
                      </p>
                    )}
                    {reportType.id === "arv" && (
                      <p className="text-sm text-slate-400">
                        Calculate the After Repair Value of a property based on comparable properties and planned renovations.
                      </p>
                    )}
                    {reportType.id === "mao" && (
                      <p className="text-sm text-slate-400">
                        Determine Maximum Allowable Offer for investment properties based on ARV, repair costs, and desired profit.
                      </p>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full bg-[#FF7A00] hover:bg-[#e56e00] text-white" onClick={() => {
                      setSelectedReportType(reportType.id);
                      setIsCreatingReport(true);
                    }}>
                      Use Template
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            <Card className="mt-8 bg-[#050e1d] border-[#0f1d31] text-white">
              <CardHeader>
                <CardTitle>Report Features</CardTitle>
                <CardDescription className="text-slate-400">
                  Our reports provide comprehensive analysis for real estate investors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <BarChart className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Data Visualization</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Interactive charts and graphs to visualize property data and market trends
                    </p>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <Calculator className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Financial Calculations</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Accurate calculations for ROI, cash flow, cap rate, and other investment metrics
                    </p>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center">
                      <Printer className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-medium">Export Options</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Export reports as PDF, share with clients, or save for your records
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Create Report Dialog */}
        <Dialog open={isCreatingReport} onOpenChange={setIsCreatingReport}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>
                Create a custom report by selecting properties and analysis type.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="reportTitle">Report Title</Label>
                <Input 
                  id="reportTitle" 
                  placeholder="Enter report title" 
                  value={newReportTitle}
                  onChange={(e) => setNewReportTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reportDescription">Description (Optional)</Label>
                <Input 
                  id="reportDescription" 
                  placeholder="Enter report description" 
                  value={newReportDescription}
                  onChange={(e) => setNewReportDescription(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                  <SelectTrigger id="reportType">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center">
                          <type.icon className="h-4 w-4 mr-2" />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Select Properties</Label>
                <div className="border rounded-md h-[300px] overflow-y-auto">
                  {isPropertiesLoading ? (
                    <div className="p-4 space-y-4">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : properties && properties.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">Select</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Beds/Baths</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {properties.map((property: Property) => (
                          <TableRow 
                            key={property.id}
                            className={selectedPropertyIds.includes(property.id) ? "bg-primary/5" : ""}
                          >
                            <TableCell>
                              <input 
                                type="checkbox" 
                                checked={selectedPropertyIds.includes(property.id)}
                                onChange={() => togglePropertySelection(property.id)}
                                className="h-4 w-4"
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              {property.address}
                            </TableCell>
                            <TableCell>
                              {property.city}, {property.state}
                            </TableCell>
                            <TableCell>
                              {formatPrice(property.price)}
                            </TableCell>
                            <TableCell>
                              {property.bedrooms}bd / {property.bathrooms}ba
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Info className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-center text-muted-foreground">
                        No properties available for selection.
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedPropertyIds.length} properties
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatingReport(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateReport} disabled={createReportMutation.isPending}>
                {createReportMutation.isPending ? "Creating..." : "Create Report"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Report Features Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Report Generation Tools</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CMA Tool */}
            <Card className="bg-[#050e1d] border-[#0f1d31] text-white">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart className="h-5 w-5 mr-2 text-[#FF7A00]" />
                  CMA Tool
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Comparative Market Analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">
                  Generate detailed CMA reports with property comparisons, 
                  market trends, and value estimations based on comparable properties.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full border-[#0f1d31] bg-[#050e1d] text-white hover:bg-[#071224] hover:text-[#FF7A00]" onClick={() => {
                  setSelectedReportType("cma");
                  setIsCreatingReport(true);
                }}>
                  Create CMA Report
                </Button>
              </CardFooter>
            </Card>
            
            {/* Investment Analysis */}
            <Card className="bg-[#050e1d] border-[#0f1d31] text-white">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-[#FF7A00]" />
                  Investment Analysis
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Financial ROI Calculator
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">
                  Analyze potential investment returns, cash flow, cap rates, and ROI for properties. 
                  Includes both short-term and long-term projections.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full border-[#0f1d31] bg-[#050e1d] text-white hover:bg-[#071224] hover:text-[#FF7A00]" onClick={() => {
                  setSelectedReportType("investment");
                  setIsCreatingReport(true);
                }}>
                  Create Investment Report
                </Button>
              </CardFooter>
            </Card>
            
            {/* Rehab Calculator */}
            <Card className="bg-[#050e1d] border-[#0f1d31] text-white">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="h-5 w-5 mr-2 text-[#FF7A00]" />
                  Rehab Calculator
                </CardTitle>
                <CardDescription className="text-slate-400">
                  ARV & MAO Estimator
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400">
                  Calculate After Repair Value and Maximum Allowable Offer for fix-and-flip 
                  properties based on comps, repair costs, and profit targets.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full border-[#0f1d31] bg-[#050e1d] text-white hover:bg-[#071224] hover:text-[#FF7A00]" onClick={() => {
                  setSelectedReportType("arv");
                  setIsCreatingReport(true);
                }}>
                  Create Rehab Report
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}