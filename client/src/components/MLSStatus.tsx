import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { InfoCircledIcon, UpdateIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { getMLSStatus, synchronizeMLSData } from '@/lib/mlsApi';
import { useToast } from '@/hooks/use-toast';

export default function MLSStatus() {
  const [status, setStatus] = useState<{
    connected: boolean;
    lastSync: string | null;
    propertyCount: number;
    error?: string;
  }>({
    connected: false,
    lastSync: null,
    propertyCount: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const data = await getMLSStatus();
      setStatus(data);
    } catch (error) {
      console.error('Error fetching MLS status:', error);
      setStatus({
        connected: false,
        lastSync: null,
        propertyCount: 0,
        error: 'Failed to connect to MLS API'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await synchronizeMLSData(100);
      toast({
        title: "MLS Synchronization Complete",
        description: `Synchronized ${result.imported} properties from MLS.`,
        variant: "default",
      });
      fetchStatus();
    } catch (error) {
      console.error('Error synchronizing MLS data:', error);
      toast({
        title: "Synchronization Failed",
        description: "Could not sync with MLS. Please check your API connection.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Refresh status every 5 minutes
    const interval = setInterval(fetchStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <InfoCircledIcon className="h-5 w-5" />
          MLS Integration Status
        </CardTitle>
        <CardDescription>
          Connection to Multiple Listing Service API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-white">
            <span>Connection Status:</span>
            <div className="flex items-center gap-1">
              {status.connected ? (
                <>
                  <CheckCircledIcon className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 font-medium">Connected</span>
                </>
              ) : (
                <>
                  <CrossCircledIcon className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 font-medium">Disconnected</span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-white">
            <span>Properties in System:</span>
            <span className="font-medium">{status.propertyCount}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm text-white">
            <span>Last Synchronized:</span>
            <span className="font-medium">
              {status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Never'}
            </span>
          </div>
          
          {status.error && (
            <div className="mt-2 text-sm text-red-400 border border-red-900 bg-red-900/30 p-2 rounded">
              {status.error}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchStatus}
          disabled={isLoading}
          className="border-gray-700 text-white hover:bg-gray-700"
        >
          {isLoading ? 'Checking...' : 'Check Status'}
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={handleSync} 
          disabled={isSyncing || !status.connected}
          className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
        >
          <UpdateIcon className="h-3.5 w-3.5" />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </CardFooter>
    </Card>
  );
}