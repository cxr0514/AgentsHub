import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  FileDown,
  FileText,
  CheckCircle2,
  ImageIcon,
  Building,
  MapPin,
  DollarSign,
  Loader2,
  Upload,
  Palette
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { CompMatchingEngine } from './CompMatchingEngine';

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType: string;
  status: string;
  daysOnMarket?: number;
  pricePerSqft?: number;
  latitude?: number;
  longitude?: number;
  images?: string[];
}

interface CMAReportOptions {
  reportTitle: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
  clientName: string;
  clientEmail: string;
  includeCoverPage: boolean;
  includeMarketAnalysis: boolean;
  includePropertyDetails: boolean;
  includePhotos: boolean;
  includeComps: boolean;
  includeAdjustments: boolean;
  includeMaps: boolean;
  includeCharts: boolean;
  reportFormat: 'pdf' | 'excel';
  reportTemplate: 'professional' | 'minimal' | 'detailed';
  brandingColor: string;
  companyLogo?: File;
  notes: string;
}

const defaultReportOptions: CMAReportOptions = {
  reportTitle: 'Comparative Market Analysis',
  agentName: '',
  agentEmail: '',
  agentPhone: '',
  clientName: '',
  clientEmail: '',
  includeCoverPage: true,
  includeMarketAnalysis: true,
  includePropertyDetails: true,
  includePhotos: true,
  includeComps: true,
  includeAdjustments: true,
  includeMaps: true,
  includeCharts: true,
  reportFormat: 'pdf',
  reportTemplate: 'professional',
  brandingColor: '#071224',
  notes: ''
};

export function CMAReportGenerator() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('property-selection');
  const [subjectProperty, setSubjectProperty] = useState<Property | null>(null);
  const [selectedComps, setSelectedComps] = useState<Property[]>([]);
  const [reportOptions, setReportOptions] = useState<CMAReportOptions>(defaultReportOptions);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [reportPreviewUrl, setReportPreviewUrl] = useState<string | null>(null);
  
  // Mutation to generate CMA report
  const generateReportMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/reports/generate-cma', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate CMA report');
      }
      
      return response.blob();
    },
    onSuccess: (blob) => {
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      setReportPreviewUrl(url);
      setActiveTab('preview');
      
      toast({
        title: 'Report Generated',
        description: 'Your CMA report has been successfully generated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Report Generation Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Handle subject property selection
  const handlePropertySelected = (property: Property) => {
    setSubjectProperty(property);
    setActiveTab('comp-selection');
  };
  
  // Handle comps selection
  const handleCompsSelected = (comps: Property[]) => {
    setSelectedComps(comps);
    setActiveTab('report-options');
  };
  
  // Handle logo upload
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an image file (JPEG, PNG, etc.)',
        variant: 'destructive'
      });
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 2MB',
        variant: 'destructive'
      });
      return;
    }
    
    // Update logo preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Update report options
    setReportOptions({
      ...reportOptions,
      companyLogo: file
    });
  };
  
  // Handle generate report button click
  const handleGenerateReport = () => {
    if (!subjectProperty) {
      toast({
        title: 'Missing Subject Property',
        description: 'Please select a subject property first',
        variant: 'destructive'
      });
      return;
    }
    
    if (selectedComps.length === 0) {
      toast({
        title: 'Missing Comparables',
        description: 'Please select at least one comparable property',
        variant: 'destructive'
      });
      return;
    }
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('subjectPropertyId', subjectProperty.id.toString());
    formData.append('compIds', JSON.stringify(selectedComps.map(comp => comp.id)));
    formData.append('options', JSON.stringify(reportOptions));
    
    if (reportOptions.companyLogo) {
      formData.append('logo', reportOptions.companyLogo);
    }
    
    generateReportMutation.mutate(formData);
  };
  
  // Handle download report
  const handleDownloadReport = () => {
    if (!reportPreviewUrl) return;
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = reportPreviewUrl;
    link.download = `${reportOptions.reportTitle.replace(/\s+/g, '_')}.${reportOptions.reportFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Card className="w-full bg-[#050e1d] border-[#0f1d31] text-white">
      <CardHeader>
        <CardTitle className="text-2xl text-white flex items-center gap-2">
          <FileText className="h-6 w-6 text-[#FF7A00]" />
          CMA Report Generator
        </CardTitle>
        <CardDescription className="text-slate-400">
          Create professional Comparative Market Analysis reports with customizable templates and branding
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="grid grid-cols-4 w-full bg-[#071224]">
            <TabsTrigger 
              value="property-selection" 
              className="flex items-center gap-2 text-slate-400 data-[state=active]:bg-[#0f1d31] data-[state=active]:text-white"
            >
              <Building className="h-4 w-4" />
              <span>Subject Property</span>
            </TabsTrigger>
            <TabsTrigger 
              value="comp-selection" 
              className="flex items-center gap-2 text-slate-400 data-[state=active]:bg-[#0f1d31] data-[state=active]:text-white" 
              disabled={!subjectProperty}
            >
              <MapPin className="h-4 w-4" />
              <span>Comp Selection</span>
            </TabsTrigger>
            <TabsTrigger 
              value="report-options" 
              className="flex items-center gap-2 text-slate-400 data-[state=active]:bg-[#0f1d31] data-[state=active]:text-white" 
              disabled={selectedComps.length === 0}
            >
              <Palette className="h-4 w-4" />
              <span>Report Options</span>
            </TabsTrigger>
            <TabsTrigger 
              value="preview" 
              className="flex items-center gap-2 text-slate-400 data-[state=active]:bg-[#0f1d31] data-[state=active]:text-white" 
              disabled={!reportPreviewUrl}
            >
              <FileText className="h-4 w-4" />
              <span>Preview & Download</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-6">
          {/* Step 1: Subject Property Selection */}
          <TabsContent value="property-selection" className="mt-0">
            <div className="space-y-4">
              <div className="bg-[#0f1d31] p-4 rounded-md border border-[#071224]">
                <h3 className="text-lg font-medium mb-2 text-white">Step 1: Select Subject Property</h3>
                <p className="text-sm text-slate-400">
                  Choose the property you want to analyze in the CMA report. This property will be compared against similar properties in the area.
                </p>
              </div>
              
              {/* For demonstration purposes, let's provide a demo property */}
              <div className="border border-[#0f1d31] bg-[#071224] rounded-md p-4 mt-6">
                <h3 className="text-md font-medium mb-2 text-white">Sample Property for Demo</h3>
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="w-full md:w-1/3 bg-[#050e1d] h-48 rounded-md flex items-center justify-center border border-[#0f1d31]">
                    <ImageIcon className="h-12 w-12 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">123 Main Street, Atlanta, GA 30303</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                      <div className="flex items-center text-sm text-slate-400">
                        <DollarSign className="h-4 w-4 mr-1 text-[#FF7A00]" />
                        <span>$450,000</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-400">
                        <span className="font-medium mr-1">3</span> bedrooms
                      </div>
                      <div className="flex items-center text-sm text-slate-400">
                        <span className="font-medium mr-1">2</span> bathrooms
                      </div>
                      <div className="flex items-center text-sm text-slate-400">
                        <span className="font-medium mr-1">2,200</span> sq ft
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button 
                        variant="default"
                        className="bg-[#FF7A00] hover:bg-[#e66e00] text-white"
                        onClick={() => handlePropertySelected({
                          id: 1,
                          address: '123 Main Street',
                          city: 'Atlanta',
                          state: 'GA',
                          zipCode: '30303',
                          price: 450000,
                          bedrooms: 3,
                          bathrooms: 2,
                          squareFeet: 2200,
                          lotSize: 0.25,
                          yearBuilt: 2005,
                          propertyType: 'single-family',
                          status: 'active',
                          daysOnMarket: 15,
                          pricePerSqft: 205,
                          latitude: 33.7490,
                          longitude: -84.3880
                        })}
                      >
                        Select This Property
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-md font-medium mb-2 text-white">Or Search For A Property</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="search-address" className="text-slate-400">Address</Label>
                    <Input id="search-address" placeholder="123 Main St" className="bg-[#071224] border-[#0f1d31] text-white focus:border-[#FF7A00] focus:ring-[#FF7A00]/10" />
                  </div>
                  <div>
                    <Label htmlFor="search-city" className="text-slate-400">City</Label>
                    <Input id="search-city" placeholder="Atlanta" className="bg-[#071224] border-[#0f1d31] text-white focus:border-[#FF7A00] focus:ring-[#FF7A00]/10" />
                  </div>
                  <div>
                    <Button className="mt-8 w-full bg-[#FF7A00] hover:bg-[#e66e00] text-white">Search</Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Step 2: Comp Selection */}
          <TabsContent value="comp-selection" className="mt-0">
            <div className="space-y-4">
              <div className="bg-[#0f1d31] p-4 rounded-md border border-[#071224]">
                <h3 className="text-lg font-medium mb-2 text-white">Step 2: Select Comparable Properties</h3>
                <p className="text-sm text-slate-400">
                  Choose properties that are similar to your subject property. These will be used for price comparisons and adjustments in the CMA report.
                </p>
              </div>
              
              {subjectProperty && (
                <div className="mt-4 p-4 border border-[#0f1d31] rounded-md bg-[#071224]">
                  <h3 className="font-medium text-white">Subject Property</h3>
                  <p className="text-slate-300">{subjectProperty.address}, {subjectProperty.city}, {subjectProperty.state} {subjectProperty.zipCode}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                    <div>${subjectProperty.price.toLocaleString()}</div>
                    <div>{subjectProperty.bedrooms} beds</div>
                    <div>{subjectProperty.bathrooms} baths</div>
                    <div>{subjectProperty.squareFeet.toLocaleString()} sq ft</div>
                  </div>
                </div>
              )}
              
              {/* For demonstration, let's create a sample list of comps */}
              <div className="mt-6">
                <h3 className="text-md font-medium mb-4 text-white">Select Comparable Properties</h3>
                
                <div className="space-y-4">
                  {[
                    {
                      id: 2,
                      address: '456 Oak St',
                      city: 'Atlanta',
                      state: 'GA',
                      zipCode: '30303',
                      price: 435000,
                      bedrooms: 3,
                      bathrooms: 2,
                      squareFeet: 2100,
                      lotSize: 0.2,
                      yearBuilt: 2003,
                      propertyType: 'single-family',
                      status: 'sold',
                      pricePerSqft: 207
                    },
                    {
                      id: 3,
                      address: '789 Pine St',
                      city: 'Atlanta',
                      state: 'GA',
                      zipCode: '30304',
                      price: 475000,
                      bedrooms: 4,
                      bathrooms: 2.5,
                      squareFeet: 2400,
                      lotSize: 0.3,
                      yearBuilt: 2007,
                      propertyType: 'single-family',
                      status: 'sold',
                      pricePerSqft: 198
                    },
                    {
                      id: 4,
                      address: '101 Elm St',
                      city: 'Atlanta',
                      state: 'GA',
                      zipCode: '30305',
                      price: 425000,
                      bedrooms: 3,
                      bathrooms: 2,
                      squareFeet: 2000,
                      lotSize: 0.22,
                      yearBuilt: 2001,
                      propertyType: 'single-family',
                      status: 'sold',
                      pricePerSqft: 213
                    }
                  ].map((prop, index) => (
                    <div key={index} className="border border-[#0f1d31] bg-[#071224] rounded-md p-4 flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white">{prop.address}, {prop.city}, {prop.state} {prop.zipCode}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 mt-2 text-sm text-slate-400">
                          <div>${prop.price.toLocaleString()}</div>
                          <div>{prop.bedrooms} beds</div>
                          <div>{prop.bathrooms} baths</div>
                          <div>{prop.squareFeet.toLocaleString()} sq ft</div>
                        </div>
                      </div>
                      <div>
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Toggle comp selection
                            if (selectedComps.some(c => c.id === prop.id)) {
                              setSelectedComps(selectedComps.filter(c => c.id !== prop.id));
                            } else {
                              setSelectedComps([...selectedComps, prop]);
                            }
                          }}
                          className={
                            selectedComps.some(c => c.id === prop.id) 
                              ? 'bg-[#0f1d31] border-[#FF7A00] text-white'
                              : 'bg-[#050e1d] border-[#0f1d31] text-slate-400 hover:bg-[#0f1d31] hover:text-white'
                          }
                        >
                          {selectedComps.some(c => c.id === prop.id) ? (
                            <CheckCircle2 className="h-4 w-4 text-[#FF7A00]" />
                          ) : 'Select'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('property-selection')}
                    className="bg-[#050e1d] border-[#0f1d31] text-slate-400 hover:bg-[#0f1d31] hover:text-white"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('report-options')}
                    disabled={selectedComps.length === 0}
                    className={selectedComps.length > 0 ? "bg-[#FF7A00] hover:bg-[#e66e00] text-white" : ""}
                  >
                    {selectedComps.length > 0 ? `Continue with ${selectedComps.length} Comps` : 'Select Comps to Continue'}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Step 3: Report Options */}
          <TabsContent value="report-options" className="mt-0">
            <div className="space-y-4">
              <div className="bg-[#0f1d31] p-4 rounded-md border border-[#071224]">
                <h3 className="text-lg font-medium mb-2 text-white">Step 3: Report Options & Customization</h3>
                <p className="text-sm text-slate-400">
                  Customize your CMA report with branding, sections, and formatting options.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium mb-4 text-white">Report Information</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reportTitle" className="text-slate-400">Report Title</Label>
                      <Input 
                        id="reportTitle" 
                        value={reportOptions.reportTitle}
                        onChange={(e) => setReportOptions({
                          ...reportOptions,
                          reportTitle: e.target.value
                        })}
                        className="bg-[#071224] border-[#0f1d31] text-white focus:border-[#FF7A00] focus:ring-[#FF7A00]/10"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="agentName" className="text-slate-400">Agent Name</Label>
                      <Input 
                        id="agentName" 
                        value={reportOptions.agentName}
                        onChange={(e) => setReportOptions({
                          ...reportOptions,
                          agentName: e.target.value
                        })}
                        className="bg-[#071224] border-[#0f1d31] text-white focus:border-[#FF7A00] focus:ring-[#FF7A00]/10"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="agentEmail" className="text-slate-400">Agent Email</Label>
                        <Input 
                          id="agentEmail" 
                          type="email"
                          value={reportOptions.agentEmail}
                          onChange={(e) => setReportOptions({
                            ...reportOptions,
                            agentEmail: e.target.value
                          })}
                          className="bg-[#071224] border-[#0f1d31] text-white focus:border-[#FF7A00] focus:ring-[#FF7A00]/10"
                        />
                      </div>
                      <div>
                        <Label htmlFor="agentPhone" className="text-slate-400">Agent Phone</Label>
                        <Input 
                          id="agentPhone" 
                          value={reportOptions.agentPhone}
                          onChange={(e) => setReportOptions({
                            ...reportOptions,
                            agentPhone: e.target.value
                          })}
                          className="bg-[#071224] border-[#0f1d31] text-white focus:border-[#FF7A00] focus:ring-[#FF7A00]/10"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="clientName" className="text-slate-400">Client Name</Label>
                      <Input 
                        id="clientName" 
                        value={reportOptions.clientName}
                        onChange={(e) => setReportOptions({
                          ...reportOptions,
                          clientName: e.target.value
                        })}
                        className="bg-[#071224] border-[#0f1d31] text-white focus:border-[#FF7A00] focus:ring-[#FF7A00]/10"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="clientEmail" className="text-slate-400">Client Email</Label>
                      <Input 
                        id="clientEmail" 
                        type="email"
                        value={reportOptions.clientEmail}
                        onChange={(e) => setReportOptions({
                          ...reportOptions,
                          clientEmail: e.target.value
                        })}
                        className="bg-[#071224] border-[#0f1d31] text-white focus:border-[#FF7A00] focus:ring-[#FF7A00]/10"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-4 text-white">Report Sections</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeCoverPage" className="text-slate-400">Include Cover Page</Label>
                      <Switch 
                        id="includeCoverPage" 
                        checked={reportOptions.includeCoverPage}
                        onCheckedChange={(checked) => setReportOptions({
                          ...reportOptions,
                          includeCoverPage: checked
                        })}
                        className="data-[state=checked]:bg-[#FF7A00]"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeMarketAnalysis" className="text-slate-400">Include Market Analysis</Label>
                      <Switch 
                        id="includeMarketAnalysis" 
                        checked={reportOptions.includeMarketAnalysis}
                        onCheckedChange={(checked) => setReportOptions({
                          ...reportOptions,
                          includeMarketAnalysis: checked
                        })}
                        className="data-[state=checked]:bg-[#FF7A00]"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includePropertyDetails" className="text-slate-400">Include Property Details</Label>
                      <Switch 
                        id="includePropertyDetails" 
                        checked={reportOptions.includePropertyDetails}
                        onCheckedChange={(checked) => setReportOptions({
                          ...reportOptions,
                          includePropertyDetails: checked
                        })}
                        className="data-[state=checked]:bg-[#FF7A00]"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includePhotos" className="text-slate-400">Include Property Photos</Label>
                      <Switch 
                        id="includePhotos" 
                        checked={reportOptions.includePhotos}
                        onCheckedChange={(checked) => setReportOptions({
                          ...reportOptions,
                          includePhotos: checked
                        })}
                        className="data-[state=checked]:bg-[#FF7A00]"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeComps" className="text-slate-400">Include Comparable Properties</Label>
                      <Switch 
                        id="includeComps" 
                        checked={reportOptions.includeComps}
                        onCheckedChange={(checked) => setReportOptions({
                          ...reportOptions,
                          includeComps: checked
                        })}
                        className="data-[state=checked]:bg-[#FF7A00]"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeAdjustments" className="text-slate-400">Include Adjustments Table</Label>
                      <Switch 
                        id="includeAdjustments" 
                        checked={reportOptions.includeAdjustments}
                        onCheckedChange={(checked) => setReportOptions({
                          ...reportOptions,
                          includeAdjustments: checked
                        })}
                        className="data-[state=checked]:bg-[#FF7A00]"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeMaps" className="text-slate-400">Include Maps</Label>
                      <Switch 
                        id="includeMaps" 
                        checked={reportOptions.includeMaps}
                        onCheckedChange={(checked) => setReportOptions({
                          ...reportOptions,
                          includeMaps: checked
                        })}
                        className="data-[state=checked]:bg-[#FF7A00]"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeCharts" className="text-slate-400">Include Charts</Label>
                      <Switch 
                        id="includeCharts" 
                        checked={reportOptions.includeCharts}
                        onCheckedChange={(checked) => setReportOptions({
                          ...reportOptions,
                          includeCharts: checked
                        })}
                        className="data-[state=checked]:bg-[#FF7A00]"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-medium mb-4 text-white">Report Format</h3>
                  <div className="space-y-4">
                    <RadioGroup 
                      value={reportOptions.reportFormat}
                      onValueChange={(value) => setReportOptions({
                        ...reportOptions,
                        reportFormat: value as 'pdf' | 'excel'
                      })}
                      className="text-slate-400"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pdf" id="pdf" className="border-slate-600 text-[#FF7A00]" />
                        <Label htmlFor="pdf" className="text-slate-400">PDF Document</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="excel" id="excel" className="border-slate-600 text-[#FF7A00]" />
                        <Label htmlFor="excel" className="text-slate-400">Excel Spreadsheet</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <h3 className="text-md font-medium mt-6 mb-4 text-white">Template Style</h3>
                  <div className="space-y-4">
                    <RadioGroup 
                      value={reportOptions.reportTemplate}
                      onValueChange={(value) => setReportOptions({
                        ...reportOptions,
                        reportTemplate: value as 'professional' | 'minimal' | 'detailed'
                      })}
                      className="text-slate-400"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="professional" id="professional" className="border-slate-600 text-[#FF7A00]" />
                        <Label htmlFor="professional" className="text-slate-400">Professional</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="minimal" id="minimal" className="border-slate-600 text-[#FF7A00]" />
                        <Label htmlFor="minimal" className="text-slate-400">Minimal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="detailed" id="detailed" className="border-slate-600 text-[#FF7A00]" />
                        <Label htmlFor="detailed" className="text-slate-400">Detailed</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium mb-4">Branding</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="brandingColor">Accent Color</Label>
                      <div className="flex gap-2 items-center mt-1">
                        <input 
                          type="color" 
                          id="brandingColor"
                          value={reportOptions.brandingColor}
                          onChange={(e) => setReportOptions({
                            ...reportOptions,
                            brandingColor: e.target.value
                          })}
                          className="w-10 h-10 border rounded-md"
                        />
                        <Input 
                          value={reportOptions.brandingColor}
                          onChange={(e) => setReportOptions({
                            ...reportOptions,
                            brandingColor: e.target.value
                          })}
                          className="w-28"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="companyLogo">Company Logo</Label>
                      <div className="mt-1">
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 border rounded-md flex items-center justify-center overflow-hidden bg-slate-50">
                            {logoPreview ? (
                              <img src={logoPreview} alt="Company logo" className="h-full w-full object-contain" />
                            ) : (
                              <Upload className="h-6 w-6 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <Input
                              id="companyLogo"
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              className="w-full"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Recommended size: 300x100px, max 2MB
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea 
                        id="notes" 
                        placeholder="Add any additional notes or instructions for the report..." 
                        className="h-28"
                        value={reportOptions.notes}
                        onChange={(e) => setReportOptions({
                          ...reportOptions,
                          notes: e.target.value
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('comp-selection')}>
                  Back
                </Button>
                <Button 
                  onClick={handleGenerateReport}
                  className="bg-[#071224] hover:bg-[#0f1d31] text-white gap-2"
                  disabled={generateReportMutation.isPending}
                >
                  {generateReportMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Generate CMA Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Step 4: Preview & Download */}
          <TabsContent value="preview" className="mt-0">
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-md border border-green-200">
                <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Report Generated Successfully
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your CMA report has been created. You can preview it below or download it to your device.
                </p>
              </div>
              
              <div className="h-[600px] border rounded-md bg-slate-50 flex items-center justify-center mt-6">
                {reportPreviewUrl ? (
                  <iframe 
                    src={reportPreviewUrl} 
                    className="w-full h-full" 
                    title="CMA Report Preview"
                  />
                ) : (
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                    <p>Report preview not available</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('report-options')}>
                  Back to Options
                </Button>
                <Button 
                  onClick={handleDownloadReport}
                  className="bg-[#071224] hover:bg-[#0f1d31] text-white gap-2"
                  disabled={!reportPreviewUrl}
                >
                  <FileDown className="h-4 w-4" />
                  Download Report
                </Button>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="border-t px-6 py-4">
        <div className="flex items-center w-full text-xs text-muted-foreground">
          <FileText className="h-4 w-4 mr-2 text-[#FF7A00]" />
          <span>
            CMA reports help clients understand property values based on comparable properties in the area.
            All data is sourced from our MLS database and public records.
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}