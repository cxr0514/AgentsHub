import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ReloadIcon, InfoCircledIcon, CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMLSStatus, synchronizeMLSData } from '../lib/mlsApi';
import { useToast } from '@/hooks/use-toast';

export default function MLSStatus() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query MLS status
  const { data: mlsStatus, isLoading: isStatusLoading, error: statusError } = useQuery({
    queryKey: ['mls', 'status'],
    queryFn: () => getMLSStatus(),
  });
  
  // Mutation for synchronizing MLS data
  const syncMutation = useMutation({
    mutationFn: (limit: number) => synchronizeMLSData(limit),
    onSuccess: (data) => {
      toast({
        title: "MLS Synchronization",
        description: data.message,
        variant: data.status === 'success' ? 'default' : 'destructive',
      });
      
      // Invalidate queries that would be affected by the sync
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['market-data'] });
      queryClient.invalidateQueries({ queryKey: ['mls', 'status'] });
    },
    onError: (error) => {
      toast({
        title: "Synchronization Failed",
        description: error instanceof Error ? error.message : "An error occurred during MLS synchronization",
        variant: 'destructive',
      });
    }
  });
  
  const handleSync = (limit: number = 100) => {
    syncMutation.mutate(limit);
  };
  
  if (statusError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <CrossCircledIcon className="h-4 w-4" />
        <AlertTitle>MLS Connection Error</AlertTitle>
        <AlertDescription>
          Unable to determine MLS connection status. Please check your API credentials.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (isStatusLoading) {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <ReloadIcon className="h-4 w-4 mr-2 animate-spin" />
            Checking MLS Connection...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          MLS Data Integration
          {mlsStatus?.isConfigured ? (
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              <CheckCircledIcon className="h-3 w-3 mr-1" /> Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
              <InfoCircledIcon className="h-3 w-3 mr-1" /> Not Configured
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Manage Multiple Listing Service (MLS) data synchronization
        </CardDescription>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <Alert variant={mlsStatus?.isConfigured ? "default" : "warning"} className="mb-4">
            <InfoCircledIcon className="h-4 w-4" />
            <AlertTitle>MLS Status</AlertTitle>
            <AlertDescription>
              {mlsStatus?.message || "MLS connection status unknown"}
            </AlertDescription>
          </Alert>
          
          <div className="text-sm">
            <p className="mb-2">
              The MLS integration allows you to fetch real estate listings directly from 
              your Multiple Listing Service provider.
            </p>
            {!mlsStatus?.isConfigured && (
              <p className="text-amber-700">
                To enable MLS integration, please configure your MLS API credentials.
              </p>
            )}
          </div>
        </CardContent>
      )}
      
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSync(25)}
            disabled={!mlsStatus?.isConfigured || syncMutation.isPending}
          >
            Sync Recent
          </Button>
          
          <Button
            onClick={() => handleSync(100)}
            disabled={!mlsStatus?.isConfigured || syncMutation.isPending}
          >
            {syncMutation.isPending ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              "Sync All Data"
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}