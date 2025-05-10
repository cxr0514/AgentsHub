import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircledIcon, CrossCircledIcon, InfoCircledIcon, ReloadIcon } from '@radix-ui/react-icons';

type DatabaseStatus = {
  connected: boolean;
  version?: string;
  error?: string;
};

export default function SystemStatus() {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    connected: false
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/system/db-status');
      if (!response.ok) {
        throw new Error('Failed to check database status');
      }
      const data = await response.json();
      setDbStatus(data);
    } catch (error) {
      console.error('Error checking database status:', error);
      setDbStatus({
        connected: false,
        error: 'Failed to connect to database'
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
    // Check status every 5 minutes
    const interval = setInterval(checkDatabaseStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <InfoCircledIcon className="h-5 w-5" />
          System Status
        </CardTitle>
        <CardDescription>
          Backend system and database connection status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Database Connection:</span>
            <div className="flex items-center gap-1">
              {dbStatus.connected ? (
                <>
                  <CheckCircledIcon className="h-4 w-4 text-green-500" />
                  <span className="text-green-500 font-medium">Connected</span>
                </>
              ) : (
                <>
                  <CrossCircledIcon className="h-4 w-4 text-red-500" />
                  <span className="text-red-500 font-medium">Disconnected</span>
                </>
              )}
            </div>
          </div>
          
          {dbStatus.version && (
            <div className="flex items-center justify-between text-sm">
              <span>Database Version:</span>
              <span className="font-medium">{dbStatus.version}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <span>API Server:</span>
            <div className="flex items-center gap-1">
              <CheckCircledIcon className="h-4 w-4 text-green-500" />
              <span className="text-green-500 font-medium">Running</span>
            </div>
          </div>
          
          {dbStatus.error && (
            <div className="mt-2 text-sm text-red-500 border border-red-200 bg-red-50 p-2 rounded">
              {dbStatus.error}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkDatabaseStatus}
          disabled={isChecking}
          className="flex items-center gap-1 w-full"
        >
          <ReloadIcon className="h-3.5 w-3.5" />
          {isChecking ? 'Checking Status...' : 'Check System Status'}
        </Button>
      </CardFooter>
    </Card>
  );
}