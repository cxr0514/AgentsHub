import { useState } from "react";
import { parseCSVtoProperties, uploadPropertiesToDatabase } from "@/lib/csvImporter";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface CsvUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CsvUploadDialog = ({ open, onOpenChange }: CsvUploadDialogProps) => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState<{
    imported: number;
    failed: number;
    success: boolean;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check if file is a CSV file
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.type.includes('csv')) {
        toast({
          title: "Invalid file format",
          description: "Please upload a CSV file",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      setUploadResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      // Process the CSV file
      setUploadProgress(30);
      const propertyData = await parseCSVtoProperties(file);
      
      if (propertyData.length === 0) {
        throw new Error("No valid property data found in CSV");
      }
      
      // Upload the parsed data
      setUploadProgress(60);
      const result = await uploadPropertiesToDatabase(propertyData);
      
      setUploadProgress(100);
      setUploadResults({
        imported: result.imported,
        failed: result.failed,
        success: result.success
      });
      
      // Show toast with results
      if (result.success) {
        toast({
          title: "Import successful",
          description: `Imported ${result.imported} properties${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
          variant: "default"
        });
        
        // Refresh property data
        queryClient.invalidateQueries({queryKey: ['/api/properties']});
      } else {
        toast({
          title: "Import failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error importing CSV:", error);
      setUploadResults({
        imported: 0,
        failed: 1,
        success: false
      });
      
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import CSV data",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setUploadResults(null);
      setUploadProgress(0);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Properties from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with property data to import into the database.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {!uploadResults && (
            <>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                {file ? (
                  <div className="space-y-2">
                    <FileText className="h-10 w-10 mx-auto text-primary" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to browse or drag and drop a CSV file
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept=".csv,text/csv"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>
              
              <div>
                <Label htmlFor="csv-format" className="text-sm font-medium">
                  CSV Format Requirements
                </Label>
                <p id="csv-format" className="text-sm text-muted-foreground mt-1">
                  The CSV should include headers such as: Address, City, State, ZipCode, Price, Bedrooms, Bathrooms, SquareFeet, etc.
                </p>
              </div>
            </>
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <Label className="text-sm">Uploading...</Label>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Processing and validating property data
              </p>
            </div>
          )}
          
          {uploadResults && (
            <div className="rounded-lg border p-4">
              {uploadResults.success ? (
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-success mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Import successful</h4>
                    <p className="text-sm text-muted-foreground">
                      Successfully imported {uploadResults.imported} properties
                      {uploadResults.failed > 0 && `, ${uploadResults.failed} failed`}.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  <AlertCircle className="h-6 w-6 text-destructive mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Import failed</h4>
                    <p className="text-sm text-muted-foreground">
                      Failed to import properties. Please check the file format and try again.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {uploadResults ? 'Close' : 'Cancel'}
          </Button>
          {!uploadResults && (
            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
              className="bg-primary hover:bg-primary/90"
            >
              {isUploading ? 'Uploading...' : 'Import Properties'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CsvUploadDialog;