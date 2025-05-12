import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, AlertCircle, Check, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function MLSSyncStatus() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("status");
  
  const { 
    data: mlsStatus, 
    isLoading: mlsStatusLoading,
    refetch: refetchStatus,
    error: mlsStatusError 
  } = useQuery({
    queryKey: ['/api/mls/status'],
    refetchInterval: 30000, // Auto refresh every 30 seconds
  });
  
  const { 
    data: schedulerStatus, 
    isLoading: schedulerStatusLoading,
    refetch: refetchScheduler,
    error: schedulerStatusError 
  } = useQuery({
    queryKey: ['/api/mls/scheduler'],
    refetchInterval: 30000, // Auto refresh every 30 seconds
  });
  
  const handleManualSync = async () => {
    try {
      const response = await fetch('/api/mls/synchronize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to trigger synchronization');
      }
      
      const data = await response.json();
      
      toast({
        title: "Synchronization Started",
        description: `Manual sync triggered: ${data.message}`,
      });
      
      // Refresh the data after a short delay
      setTimeout(() => {
        refetchStatus();
        refetchScheduler();
      }, 1500);
      
    } catch (error) {
      console.error('Error triggering sync:', error);
      toast({
        title: "Synchronization Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  const handleSchedulerAction = async (action: string) => {
    try {
      const response = await fetch(`/api/mls/scheduler/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} scheduler`);
      }
      
      const data = await response.json();
      
      toast({
        title: `Scheduler ${action === 'start' ? 'Started' : 'Stopped'}`,
        description: data.message,
      });
      
      // Refresh scheduler data after action
      setTimeout(() => {
        refetchScheduler();
      }, 500);
      
    } catch (error) {
      console.error(`Error ${action}ing scheduler:`, error);
      toast({
        title: `Scheduler ${action === 'start' ? 'Start' : 'Stop'} Failed`,
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Get status of the automatic scheduler
  const isSchedulerRunning = schedulerStatus?.jobs?.MLS_SYNC?.running || false;
  
  // Determine MLS connection status
  const mlsActive = mlsStatus?.status === 'active';
  const lastSyncTime = mlsStatus?.lastSync ? new Date(mlsStatus.lastSync) : null;
  const formattedLastSync = lastSyncTime 
    ? formatDistanceToNow(lastSyncTime, { addSuffix: true })
    : 'never';
    
  // ATTOM API integration status
  const attomIntegrationInProgress = true; // Set to true while we're working on the ATTOM API integration
  
  // Handle loading and error states
  const isLoading = mlsStatusLoading || schedulerStatusLoading;
  const hasError = mlsStatusError || schedulerStatusError;
  
  if (isLoading) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            MLS Synchronization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (hasError) {
    return (
      <Card className="w-full shadow-md border-destructive/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            MLS Synchronization Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              Unable to fetch MLS synchronization status. Please try again later.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" size="sm" onClick={() => {
            refetchStatus();
            refetchScheduler();
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          MLS Synchronization
          <Badge variant={mlsActive ? "default" : "outline"} className="ml-2">
            {mlsActive ? "Active" : "Inactive"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Keep property data synchronized with MLS
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="status" value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="status" className="flex-1">Status</TabsTrigger>
            <TabsTrigger value="scheduler" className="flex-1">Auto-Sync</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="status" className="pt-2">
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Connection Status:</span>
                <Badge variant={mlsActive ? "default" : "outline"}>
                  {mlsActive ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Last Sync:</span>
                <span className="text-sm">{formattedLastSync}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Properties Count:</span>
                <span className="text-sm">{mlsStatus?.propertiesCount || 0}</span>
              </div>
            </div>
          </CardContent>
          
          {attomIntegrationInProgress && (
            <div className="px-6 pb-2">
              <Alert variant="warning" className="bg-amber-50 border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-800 text-sm font-medium">ATTOM API Integration In Progress</AlertTitle>
                <AlertDescription className="text-amber-700 text-xs">
                  We're currently updating the ATTOM API integration to ensure accurate market data. 
                  Temporary fallback data is being used while we complete this process.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <CardFooter className="flex justify-between">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      refetchStatus();
                      refetchScheduler();
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh status information</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={handleManualSync}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Manually trigger synchronization</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="scheduler" className="pt-2">
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Scheduler Status:</span>
                <Badge variant={isSchedulerRunning ? "default" : "outline"} className={isSchedulerRunning ? "bg-green-600" : ""}>
                  {isSchedulerRunning ? (
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-white/80 mr-2 animate-pulse"></div>
                      Running
                    </div>
                  ) : "Stopped"}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Update Interval:</span>
                <span className="text-sm">
                  {schedulerStatus?.jobs?.MLS_SYNC?.interval 
                    ? `${Math.round(schedulerStatus.jobs.MLS_SYNC.interval / 60000)} minutes` 
                    : "1 hour"}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Next Update:</span>
                <span className="text-sm">
                  {isSchedulerRunning && schedulerStatus?.jobs?.MLS_SYNC?.nextRun 
                    ? formatDistanceToNow(new Date(schedulerStatus.jobs.MLS_SYNC.nextRun), { addSuffix: true }) 
                    : "N/A"}
                </span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refetchScheduler()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh scheduler status</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={isSchedulerRunning ? "destructive" : "default"}
                    size="sm"
                    onClick={() => handleSchedulerAction(isSchedulerRunning ? 'stop' : 'start')}
                  >
                    {isSchedulerRunning ? (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Stop Scheduler
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Start Scheduler
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isSchedulerRunning ? "Stop automatic updates" : "Start automatic updates"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardFooter>
        </TabsContent>
      </Tabs>
    </Card>
  );
}