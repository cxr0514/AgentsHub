import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Property, PropertyRecommendation, User } from '@shared/schema';
import { Loader2, RefreshCw, Building2, DollarSign, BedDouble, Bath, Square } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface AIPropertyRecommendationsProps {
  userId: number;
}

const AIPropertyRecommendations = ({ userId }: AIPropertyRecommendationsProps) => {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch existing recommendations
  const { data: recommendations, isLoading, error } = useQuery({
    queryKey: ['/api/recommendations', userId],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }
      return await response.json();
    }
  });

  // Generate new recommendations
  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const response = await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations', userId] });
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Error generating recommendations:', error);
      setIsGenerating(false);
    }
  });

  // Handle regenerate
  const handleRegenerateRecommendations = () => {
    generateMutation.mutate();
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Property Recommendations</CardTitle>
          <CardDescription>Loading your personalized property recommendations...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Property Recommendations</CardTitle>
          <CardDescription>We couldn't load your recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {(error as Error).message}</p>
          <Button 
            variant="default" 
            className="mt-4"
            onClick={handleRegenerateRecommendations}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // If no recommendations exist yet
  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Property Recommendations</CardTitle>
          <CardDescription>Let AI find properties that match your preferences</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="mb-4">You don't have any property recommendations yet.</p>
          <Button 
            variant="default" 
            onClick={handleRegenerateRecommendations}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating recommendations...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate Recommendations
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Get the latest recommendation
  const latestRecommendation = recommendations[0] as PropertyRecommendation;
  const recommendedProperties = latestRecommendation.recommendations as any[];
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>AI Property Recommendations</CardTitle>
            <CardDescription>
              Personalized property suggestions based on your preferences
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRegenerateRecommendations}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendedProperties.map((property, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-1/3 bg-muted h-48 sm:h-auto relative">
                  {property.imageUrl ? (
                    <img 
                      src={property.imageUrl} 
                      alt={property.address} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2 bg-[#FF7A00]">
                    {property.matchScore}% Match
                  </Badge>
                </div>
                <div className="flex-1 p-4">
                  <h3 className="text-lg font-semibold mb-1">{property.address}</h3>
                  <p className="text-muted-foreground text-sm mb-3">
                    {property.city}, {property.state} {property.zipCode}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>{formatCurrency(property.price)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Square className="h-4 w-4 text-muted-foreground" />
                      <span>{formatNumber(property.squareFeet)} sqft</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-muted-foreground" />
                      <span>{property.bedrooms} beds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4 text-muted-foreground" />
                      <span>{property.bathrooms} baths</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <strong>Why we recommended this:</strong> {property.reasonForRecommendation}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Recommendations generated on {new Date(latestRecommendation.createdAt).toLocaleDateString()} 
          based on your saved searches and property preferences.
        </p>
      </CardFooter>
    </Card>
  );
};

export default AIPropertyRecommendations;