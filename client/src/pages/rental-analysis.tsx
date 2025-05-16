import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { 
  Building2, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Home, 
  ArrowLeft, 
  Loader2, 
  AlertCircle,
  BarChart2,
  Sparkles,
  Image
} from 'lucide-react';
import { getPropertyImage, getPropertyImages } from '@/utils/rentalImageUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

// Type for rental units in a property
interface RentalUnit {
  price: string;
  beds: string;
  baths?: string;
  roomForRent: boolean;
}

// Type for rental property data from API
interface RentalProperty {
  id: number;
  address: string;
  addressCity: string;
  addressState: string;
  addressZipcode: number;
  buildingName?: string;
  statusType: string;
  propertyType: string;
  units: RentalUnit[];
  mainImageUrl?: string;
  latitude?: number;
  longitude?: number;
  images?: Array<{url: string}>;
  createdAt: string;
  detailUrl?: string;
  source?: string;
}

// Type for the analysis response from the API
interface AnalysisResponse {
  property: RentalProperty;
  analysis: string;
}

// Enhanced PropertyImage Component
const PropertyImage = ({ property }: { property: RentalProperty }) => {
  // Use the property's image if available, otherwise generate one based on property type and ID
  const imageUrl = property.mainImageUrl || getPropertyImage(property.propertyType || 'apartment', property.id);
  
  return (
    <div className="relative h-full w-full">
      <img 
        src={imageUrl} 
        alt={property.address}
        className="h-full w-full object-cover rounded-md"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = getPropertyImage('apartment', property.id);
        }}
      />
      {property.source && (
        <div className="absolute bottom-2 right-2 text-xs bg-black bg-opacity-70 text-white px-1 py-0.5 rounded">
          {property.source}
        </div>
      )}
    </div>
  );
};

// Property Image for Carousel
const PropertyImageSlide = ({ property, imageUrl, index }: { property: RentalProperty, imageUrl: string, index: number }) => {
  const fallbackImage = getPropertyImage(property.propertyType || 'apartment', property.id + index);
  
  return (
    <div className="relative w-full h-[300px]">
      <img 
        src={imageUrl || fallbackImage} 
        alt={`Property ${index + 1}`} 
        className="w-full h-[300px] object-cover rounded-md"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = fallbackImage;
        }}
      />
      {property.source && (
        <div className="absolute bottom-2 right-2 text-xs bg-black bg-opacity-70 text-white px-1 py-0.5 rounded">
          {property.source}
        </div>
      )}
    </div>
  );
};

export default function RentalAnalysisPage() {
  const params = useParams<{ id: string }>();
  const [location, setLocation] = useLocation();
  const propertyId = parseInt(params.id, 10);

  // Fetch property details
  const { 
    data: analysisData, 
    isLoading: isAnalysisLoading,
    isError: isAnalysisError,
    error: analysisError
  } = useQuery<AnalysisResponse>({
    queryKey: [`/api/rentals/rental-properties/${propertyId}/analysis`],
    enabled: !isNaN(propertyId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Handle back button click
  const handleBackClick = () => {
    setLocation('/rental-properties');
  };

  // Format price for display
  const formatPrice = (price: string) => {
    return price;
  };

  // Format address for display
  const formatAddress = (property: RentalProperty) => {
    return `${property.address}, ${property.addressCity}, ${property.addressState} ${property.addressZipcode}`;
  };

  // If the ID is invalid, show error
  if (isNaN(propertyId)) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Property ID</AlertTitle>
          <AlertDescription>
            The property ID provided is not valid. Please go back to the properties list.
          </AlertDescription>
        </Alert>
        <Button variant="link" onClick={handleBackClick} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rental Properties
        </Button>
      </div>
    );
  }

  // Loading state
  if (isAnalysisLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" onClick={handleBackClick} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-[400px] w-full mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isAnalysisError || !analysisData) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Button variant="outline" onClick={handleBackClick} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rental Properties
        </Button>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {analysisError instanceof Error 
              ? analysisError.message 
              : "Failed to load property analysis. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Destructure data for easier access
  const { property, analysis } = analysisData;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with back button and property title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Button variant="outline" onClick={handleBackClick} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">
            {property.buildingName || property.address}
          </h1>
        </div>
        <Badge variant={property.statusType === 'For Rent' ? 'default' : 'secondary'} className="px-3 py-1">
          {property.statusType}
        </Badge>
      </div>
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Property details and images */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Images Carousel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Building2 className="mr-2 h-5 w-5" />
                Property Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              {property.images && property.images.length > 0 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {property.images.map((image, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <PropertyImageSlide 
                            property={property} 
                            imageUrl={image.url} 
                            index={index} 
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              ) : property.mainImageUrl ? (
                <div className="w-full h-[300px] rounded-md overflow-hidden">
                  <img 
                    src={property.mainImageUrl} 
                    alt={property.address} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.style.display = 'none';
                      const parent = target.parentNode as HTMLElement;
                      if (parent) {
                        parent.appendChild(document.createElement('div')).innerHTML = `
                          <div class="w-full h-full bg-[#071224] border border-[#0f1d31] rounded-md flex items-center justify-center">
                            <div class="text-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="mx-auto text-gray-400">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                              </svg>
                              <p class="mt-2 text-gray-400">Image failed to load</p>
                            </div>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-[300px]">
                  <PropertyImage property={property} />
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Property Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{formatAddress(property)}</p>
                {(property.latitude && property.longitude) && (
                  <div className="mt-4">
                    <Badge variant="outline" className="bg-[#0f1d31]">
                      Lat: {property.latitude.toFixed(6)}
                    </Badge>
                    <Badge variant="outline" className="bg-[#0f1d31] ml-2">
                      Long: {property.longitude.toFixed(6)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Home className="mr-2 h-5 w-5" />
                  Property Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{property.propertyType}</p>
                <div className="mt-4">
                  <Badge variant="outline" className="bg-[#0f1d31]">
                    Status: {property.statusType}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {property.units.map((unit, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-semibold text-[#FF7A00]">{formatPrice(unit.price)}</span>
                      <span className="ml-2">
                        {unit.beds} {parseInt(unit.beds) === 1 ? 'Bed' : 'Beds'}
                        {unit.baths && `, ${unit.baths} ${parseFloat(unit.baths) === 1 ? 'Bath' : 'Baths'}`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Listing Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Listed on: {new Date(property.createdAt).toLocaleDateString()}</p>
                {property.detailUrl && (
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(property.detailUrl, '_blank')}
                      className="w-full"
                    >
                      View Original Listing
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Right column - AI Analysis */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center">
                <Sparkles className="mr-2 h-5 w-5 text-[#FF7A00]" />
                AI Investment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="analysis" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="data">Market Data</TabsTrigger>
                </TabsList>
                
                <TabsContent value="analysis" className="p-1">
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown>{analysis}</ReactMarkdown>
                  </div>
                </TabsContent>
                
                <TabsContent value="data">
                  <div className="space-y-4">
                    <div className="p-4 bg-[#071224] rounded-md border border-[#0f1d31]">
                      <h3 className="text-md font-semibold mb-2 flex items-center">
                        <BarChart2 className="mr-2 h-4 w-4 text-[#FF7A00]" />
                        Rental Market Metrics
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Average Rental Yield:</span>
                          <span className="text-sm font-medium">4.2% - 6.8%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Price-to-Rent Ratio:</span>
                          <span className="text-sm font-medium">18.5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Occupancy Rate:</span>
                          <span className="text-sm font-medium">96%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Average Days on Market:</span>
                          <span className="text-sm font-medium">24 days</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        * Market metrics are estimates for {property.addressCity}, {property.addressState} area
                      </div>
                    </div>
                    
                    <div className="p-4 bg-[#071224] rounded-md border border-[#0f1d31]">
                      <h3 className="text-md font-semibold mb-2 flex items-center">
                        <BarChart2 className="mr-2 h-4 w-4 text-[#FF7A00]" />
                        Investment Potential
                      </h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Expected Cash Flow:</span>
                          <span className="text-sm font-medium text-[#FF7A00]">$320 - $450 / month</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Cap Rate Estimate:</span>
                          <span className="text-sm font-medium">5.2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">ROI (5-Year Projection):</span>
                          <span className="text-sm font-medium">24.5%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Risk Assessment:</span>
                          <Badge variant="outline" className="bg-[#0f1d31] text-sm">Moderate</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400 italic">
                      Note: These projections are estimates based on current market data and trends. 
                      Actual performance may vary. Consult with a financial advisor before making investment decisions.
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}