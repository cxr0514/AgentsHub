import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, Upload, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Redirect } from 'wouter';

export default function RentalImportPage() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);
  const { toast } = useToast();
  
  // Redirect if not admin
  if (user && user.role !== 'admin') {
    return <Redirect to="/" />;
  }
  
  // If not logged in, this will be caught by the ProtectedRoute component
  
  // Get current rental property count
  const { data: countData, isLoading: countLoading } = useQuery<{count: number}>({
    queryKey: ['/api/rentals/rental-properties/count'],
    staleTime: 60 * 1000, // 1 minute
  });
  
  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setFileUploading(true);
      const formData = new FormData();
      formData.append('rentalData', file);
      
      const response = await fetch('/api/rentals/rental-properties/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload file');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Upload Successful',
        description: data.message,
        variant: 'default',
      });
      setSelectedFile(null);
      // Invalidate rental properties query
      queryClient.invalidateQueries({ queryKey: ['/api/rental-properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rentals/rental-properties/count'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setFileUploading(false);
    },
  });
  
  // Import sample data mutation
  const importSampleMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/rentals/rental-properties/import-sample');
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Import Successful',
        description: `Successfully imported ${data.imported} rental properties with ${data.errors} errors`,
        variant: 'default',
      });
      // Invalidate rental properties query
      queryClient.invalidateQueries({ queryKey: ['/api/rental-properties'] });
      queryClient.invalidateQueries({ queryKey: ['/api/rentals/rental-properties/count'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Import Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/json') {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a JSON file',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };
  
  // Handle file upload
  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }
    
    uploadMutation.mutate(selectedFile);
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold">Rental Property Data Import</h1>
        
        {/* Current Count */}
        <Card className="bg-[#071224] border-[#0f1d31]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Database className="h-8 w-8 text-[#FF7A00]" />
              <div>
                <h3 className="text-lg font-medium">Current Rental Properties</h3>
                {countLoading ? (
                  <p className="text-2xl font-semibold flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </p>
                ) : (
                  <p className="text-2xl font-semibold">{countData?.count || 0} properties</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload JSON File</TabsTrigger>
            <TabsTrigger value="sample">Import Sample Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload">
            <Card className="bg-[#071224] border-[#0f1d31]">
              <CardHeader>
                <CardTitle>Upload Zillow Rental Data</CardTitle>
                <CardDescription>
                  Upload a JSON file containing rental property data in Zillow Outscraper format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#0f1d31] rounded-md bg-[#050e1d]">
                  <Upload className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-400 mb-4">
                    Drag and drop or click to browse
                  </p>
                  <input
                    type="file"
                    id="file-upload"
                    accept=".json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="px-4 py-2 bg-[#0f1d31] text-white rounded cursor-pointer hover:bg-[#192841] transition-colors"
                  >
                    Select JSON File
                  </label>
                  {selectedFile && (
                    <div className="mt-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm">{selectedFile.name}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setSelectedFile(null)} disabled={!selectedFile || fileUploading}>
                  Clear
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedFile || fileUploading}
                  className="bg-[#FF7A00] hover:bg-[#E86E00] text-white"
                >
                  {fileUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="sample">
            <Card className="bg-[#071224] border-[#0f1d31]">
              <CardHeader>
                <CardTitle>Import Sample Data</CardTitle>
                <CardDescription>
                  Import the sample rental data file (Outscraper-20250513184410s1c.json)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="bg-[#122348] border-[#253e80]">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Sample Data</AlertTitle>
                  <AlertDescription>
                    This will import the sample rental property data for Atlanta, GA from the Outscraper Zillow dataset.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => importSampleMutation.mutate()}
                  disabled={importSampleMutation.isPending}
                  className="w-full bg-[#FF7A00] hover:bg-[#E86E00] text-white"
                >
                  {importSampleMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing Sample Data...
                    </>
                  ) : (
                    'Import Sample Data'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Show upload status or errors */}
        {uploadMutation.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {uploadMutation.error.message}
            </AlertDescription>
          </Alert>
        )}
        
        {importSampleMutation.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {importSampleMutation.error.message}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}