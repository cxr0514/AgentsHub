import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, HomeIcon, DollarSign, Star, Check, X, FileText, InfoIcon, ArrowRight } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface PropertyAnalyzerProps {
  initialPropertyData?: {
    address?: string;
    price?: number;
    propertyType?: string;
    sqft?: number;
    beds?: number;
    baths?: number;
  };
}

export function PropertyAnalyzer({ initialPropertyData }: PropertyAnalyzerProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    address: initialPropertyData?.address || '',
    price: initialPropertyData?.price || 500000,
    propertyType: initialPropertyData?.propertyType || 'single-family',
    sqft: initialPropertyData?.sqft || 2000,
    beds: initialPropertyData?.beds || 3,
    baths: initialPropertyData?.baths || 2,
  });
  
  const [activeTab, setActiveTab] = useState('form');
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Save to localStorage when analysis is successful
  const saveToHistory = (data: any) => {
    try {
      // Get existing history
      const historyString = localStorage.getItem('propertyAnalysisHistory');
      const history = historyString ? JSON.parse(historyString) : [];
      
      // Add new item with timestamp
      const newItem = {
        ...formData,
        analysis: data.analysis,
        timestamp: new Date().toISOString(),
      };
      
      // Only keep last 10 items
      const updatedHistory = [newItem, ...history].slice(0, 10);
      
      // Save back to localStorage
      localStorage.setItem('propertyAnalysisHistory', JSON.stringify(updatedHistory));
    } catch (err) {
      console.error('Failed to save analysis to history:', err);
    }
  };
  
  // Get analysis history from localStorage
  const getAnalysisHistory = () => {
    try {
      const historyString = localStorage.getItem('propertyAnalysisHistory');
      return historyString ? JSON.parse(historyString) : [];
    } catch (err) {
      console.error('Failed to get analysis history:', err);
      return [];
    }
  };
  
  // Property types for dropdown
  const propertyTypes = [
    { value: 'single-family', label: 'Single Family Home' },
    { value: 'multi-family', label: 'Multi-Family' },
    { value: 'condo', label: 'Condo/Townhouse' },
    { value: 'commercial', label: 'Commercial' },
  ];
  
  // Mutation to analyze property
  const analyzePropertyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest('POST', '/api/market-analysis/analyze-property', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to analyze property');
      }
      return res.json();
    },
    onSuccess: (data) => {
      setActiveTab('analysis');
      toast({
        title: 'Analysis Complete',
        description: 'Property investment analysis has been generated successfully.',
      });
      saveToHistory(data);
    },
    onError: (error) => {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Valid price is required';
    }
    
    if (!formData.sqft || formData.sqft <= 0) {
      newErrors.sqft = 'Valid square footage is required';
    }
    
    if (!formData.beds || formData.beds <= 0) {
      newErrors.beds = 'Number of bedrooms is required';
    }
    
    if (!formData.baths || formData.baths <= 0) {
      newErrors.baths = 'Number of bathrooms is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      analyzePropertyMutation.mutate(formData);
    }
  };
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Format analysis text with some basic styling
  const formatAnalysis = (text: string) => {
    if (!text) return null;
    
    // Split into paragraphs
    const paragraphs = text.split('\n\n');
    
    return (
      <div className="space-y-4">
        {paragraphs.map((paragraph, index) => {
          // Check if this is a heading (uses markdown-like formatting)
          if (paragraph.startsWith('# ')) {
            return <h3 key={index} className="text-xl font-bold mt-6 mb-2">{paragraph.substring(2)}</h3>;
          }
          
          // Check if this is a subheading
          if (paragraph.startsWith('## ')) {
            return <h4 key={index} className="text-lg font-semibold mt-4 mb-1">{paragraph.substring(3)}</h4>;
          }
          
          // Check if this is a list
          if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
            const items = paragraph.split('\n').map(item => item.substring(2));
            return (
              <ul key={index} className="list-disc pl-5 space-y-1">
                {items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            );
          }
          
          // Check for property rating
          if (paragraph.includes('Rating:') || paragraph.includes('rating:')) {
            // Try to extract a rating number
            const ratingMatch = paragraph.match(/(?:Rating|rating):\s*(\d+(?:\.\d+)?)\s*\/\s*10/);
            if (ratingMatch) {
              const ratingValue = parseFloat(ratingMatch[1]);
              const stars = Math.round(ratingValue / 2); // Convert to 5-star scale
              
              return (
                <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-[#FF7A00]" />
                    <span className="font-semibold">Investment Rating: {ratingValue}/10</span>
                  </div>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${i < stars ? 'text-[#FF7A00] fill-[#FF7A00]' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
              );
            }
          }
          
          // Check for recommendation
          if (paragraph.toLowerCase().includes('recommendation:')) {
            let recommendationType = 'neutral';
            if (paragraph.toLowerCase().includes('buy') || paragraph.toLowerCase().includes('strong buy')) {
              recommendationType = 'buy';
            } else if (paragraph.toLowerCase().includes('pass') || paragraph.toLowerCase().includes('avoid')) {
              recommendationType = 'pass';
            } else if (paragraph.toLowerCase().includes('negotiate')) {
              recommendationType = 'negotiate';
            }
            
            return (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${
                  recommendationType === 'buy' ? 'bg-green-50 border-green-200' : 
                  recommendationType === 'pass' ? 'bg-red-50 border-red-200' : 
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {recommendationType === 'buy' ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : recommendationType === 'pass' ? (
                    <X className="h-5 w-5 text-red-600" />
                  ) : (
                    <InfoIcon className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="font-semibold">
                    {paragraph}
                  </span>
                </div>
              </div>
            );
          }
          
          // Regular paragraph
          return <p key={index} className="text-gray-700">{paragraph}</p>;
        })}
      </div>
    );
  };
  
  const analysisHistory = getAnalysisHistory();

  return (
    <Card className="w-full border-[#0f1d31] bg-[#050e1d]">
      <CardHeader>
        <CardTitle className="text-2xl text-white flex items-center gap-2">
          <HomeIcon className="h-6 w-6 text-[#FF7A00]" />
          Property Investment Analyzer
        </CardTitle>
        <CardDescription className="text-slate-300">
          Analyze any property as an investment with our AI-powered tool
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="form" className="flex items-center gap-2">
              <HomeIcon className="h-4 w-4" />
              <span>Property Details</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2" disabled={!analyzePropertyMutation.data}>
              <FileText className="h-4 w-4" />
              <span>Analysis Results</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="pt-6">
          <TabsContent value="form" className="mt-0">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 md:col-span-2">
                  <div>
                    <Label htmlFor="address" className="text-white">Property Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="123 Main St, Atlanta, GA 30303"
                      value={formData.address}
                      onChange={handleChange}
                      className={`bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-400 ${errors.address ? 'border-red-500' : ''}`}
                    />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="price" className="text-white">Price ($)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="500000"
                      value={formData.price}
                      onChange={handleChange}
                      className={`bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-400 ${errors.price ? 'border-red-500' : ''}`}
                    />
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="propertyType" className="text-white">Property Type</Label>
                    <select
                      id="propertyType"
                      name="propertyType"
                      value={formData.propertyType}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-[#0f1d31] bg-[#071224] px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {propertyTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="sqft" className="text-white">Square Footage</Label>
                    <Input
                      id="sqft"
                      name="sqft"
                      type="number"
                      placeholder="2000"
                      value={formData.sqft}
                      onChange={handleChange}
                      className={`bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-400 ${errors.sqft ? 'border-red-500' : ''}`}
                    />
                    {errors.sqft && <p className="text-red-500 text-sm mt-1">{errors.sqft}</p>}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="beds" className="text-white">Bedrooms</Label>
                    <Input
                      id="beds"
                      name="beds"
                      type="number"
                      placeholder="3"
                      value={formData.beds}
                      onChange={handleChange}
                      className={`bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-400 ${errors.beds ? 'border-red-500' : ''}`}
                    />
                    {errors.beds && <p className="text-red-500 text-sm mt-1">{errors.beds}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="baths" className="text-white">Bathrooms</Label>
                    <Input
                      id="baths"
                      name="baths"
                      type="number"
                      placeholder="2"
                      value={formData.baths}
                      onChange={handleChange}
                      className={`bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-400 ${errors.baths ? 'border-red-500' : ''}`}
                      step="0.5"
                    />
                    {errors.baths && <p className="text-red-500 text-sm mt-1">{errors.baths}</p>}
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <Button 
                      type="submit"
                      className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white"
                      disabled={analyzePropertyMutation.isPending}
                    >
                      {analyzePropertyMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Analyze Property
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
            
            <div className="mt-6">
              <Separator className="my-4" />
              <div className="flex items-center">
                <InfoIcon className="h-5 w-5 text-muted-foreground mr-2" />
                <p className="text-sm text-slate-300">
                  This tool uses AI to analyze property investments. Enter accurate details above for the best results.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analysis" className="mt-0">
            {analyzePropertyMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-[#FF7A00] mb-4" />
                <h3 className="text-lg font-medium">Analyzing Property Investment</h3>
                <p className="text-muted-foreground mt-2">
                  Our AI is analyzing this property as an investment opportunity. This may take a moment...
                </p>
              </div>
            ) : analyzePropertyMutation.isError ? (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {analyzePropertyMutation.error?.message || "There was an error analyzing this property."}
                </AlertDescription>
              </Alert>
            ) : analyzePropertyMutation.data ? (
              <div className="space-y-6">
                <div className="bg-[#071224] p-4 rounded-lg border border-[#0f1d31]">
                  <div className="flex flex-wrap gap-4 items-start">
                    <div className="flex-1 min-w-[200px]">
                      <h3 className="font-semibold text-lg text-white">{formData.address}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-300">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-[#FF7A00]" />
                          <span>${formData.price?.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HomeIcon className="h-4 w-4 text-[#FF7A00]" />
                          <span>{formData.beds} bd | {formData.baths} ba | {formData.sqft?.toLocaleString()} sqft</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#050e1d] rounded-lg border border-[#0f1d31] p-6">
                  <h3 className="text-xl font-semibold mb-4 text-white">Investment Analysis</h3>
                  <div className="text-slate-300">
                    {formatAnalysis(analyzePropertyMutation.data.analysis)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white">No Analysis Available</h3>
                <p className="text-slate-300 mt-2 mb-4">
                  Fill out the property details and click "Analyze Property" to get started.
                </p>
                <Button onClick={() => setActiveTab('form')} className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white">Enter Property Details</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="mt-0">
            {analysisHistory.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white">No Analysis History</h3>
                <p className="text-slate-300 mt-2 mb-4">
                  You haven't analyzed any properties yet. Analysis results will be saved here for future reference.
                </p>
                <Button onClick={() => setActiveTab('form')} className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white">Analyze a Property</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-2 text-white">Recent Property Analyses</h3>
                
                {analysisHistory.map((item: any, index: number) => (
                  <Card key={index} className="overflow-hidden border-[#0f1d31]">
                    <CardHeader className="p-4 bg-[#071224]">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base text-white">{item.address}</CardTitle>
                          <CardDescription className="text-xs text-slate-300">
                            {new Date(item.timestamp).toLocaleDateString()} - ${item.price.toLocaleString()}
                          </CardDescription>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setFormData({
                              address: item.address,
                              price: item.price,
                              propertyType: item.propertyType,
                              sqft: item.sqft,
                              beds: item.beds,
                              baths: item.baths
                            });
                            
                            // Set this as the current analysis data
                            analyzePropertyMutation.reset();
                            analyzePropertyMutation.mutate(
                              { 
                                address: item.address,
                                price: item.price,
                                propertyType: item.propertyType,
                                sqft: item.sqft,
                                beds: item.beds,
                                baths: item.baths 
                              },
                              {
                                onSuccess: () => {
                                  setActiveTab('analysis');
                                }
                              }
                            );
                          }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 bg-[#050e1d] border-t border-[#0f1d31]">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                        <div>{item.beds} beds | {item.baths} baths</div>
                        <div>{item.sqft} sqft</div>
                        <div>{propertyTypes.find(t => t.value === item.propertyType)?.label || item.propertyType}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="border-t border-[#0f1d31] px-6 py-4">
        <div className="flex items-center w-full text-xs text-slate-300">
          <FileText className="h-4 w-4 mr-2 text-[#FF7A00]" />
          <span>
            Analysis is generated using AI based on property details and market data.
            For a comprehensive investment decision, consult with a licensed professional.
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}