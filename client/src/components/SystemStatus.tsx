import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ReloadIcon, CheckCircledIcon, CrossCircledIcon, QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { apiRequest } from '../lib/queryClient';

type DatabaseStatus = {
  connected: boolean;
  version?: string;
  error?: string;
};

export default function SystemStatus() {
  const [isExpanded, setIsExpanded] = useState(false);

  // Query for database status
  const { 
    data: dbStatus, 
    isLoading: isDatabaseLoading, 
    error: dbError,
    refetch: refetchDbStatus 
  } = useQuery({
    queryKey: ['system', 'db-status'],
    queryFn: () => apiRequest<DatabaseStatus>('/api/system/db-status', { method: 'GET' }),
  });

  const handleRefreshStatus = () => {
    refetchDbStatus();
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">System Status</CardTitle>
        <CardDescription>
          Database and integration system status
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Database:</span>
          
          {isDatabaseLoading ? (
            <Badge variant="outline" className="bg-slate-50 text-slate-700">
              <ReloadIcon className="h-3 w-3 mr-1 animate-spin" /> Checking...
            </Badge>
          ) : dbError ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <QuestionMarkCircledIcon className="h-3 w-3 mr-1" /> Unknown
            </Badge>
          ) : dbStatus?.connected ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircledIcon className="h-3 w-3 mr-1" /> Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/20">
              <CrossCircledIcon className="h-3 w-3 mr-1" /> Disconnected
            </Badge>
          )}
        </div>
        
        {isExpanded && (
          <>
            {dbStatus?.connected && dbStatus?.version && (
              <Alert className="mt-2">
                <AlertTitle>PostgreSQL Database</AlertTitle>
                <AlertDescription className="text-xs break-all">
                  {dbStatus.version}
                </AlertDescription>
              </Alert>
            )}
            
            {dbStatus && !dbStatus.connected && dbStatus.error && (
              <Alert variant="destructive" className="mt-2">
                <AlertTitle>Database Connection Error</AlertTitle>
                <AlertDescription className="text-xs break-all">
                  {dbStatus.error}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleRefreshStatus}
          disabled={isDatabaseLoading}
        >
          {isDatabaseLoading ? (
            <>
              <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <ReloadIcon className="mr-2 h-4 w-4" />
              Refresh Status
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}