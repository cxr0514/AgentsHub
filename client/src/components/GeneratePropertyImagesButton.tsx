import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Image } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface GeneratePropertyImagesButtonProps {
  onComplete?: () => void;
  count?: number;
}

const GeneratePropertyImagesButton = ({ 
  onComplete, 
  count = 0 
}: GeneratePropertyImagesButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerateImages = async () => {
    try {
      setIsGenerating(true);
      
      toast({
        title: "Generating property images",
        description: "This may take a moment. Please wait...",
      });
      
      const response = await apiRequest("POST", "/api/property-images/generate-all");
      const data = await response.json();
      
      toast({
        title: "Image generation started",
        description: data.message,
        variant: "default",
      });
      
      // Call the onComplete callback to refresh the property list
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error generating property images:", error);
      
      toast({
        title: "Error generating images",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGenerateImages}
      disabled={isGenerating}
      className="flex items-center gap-1"
    >
      <Image className="h-4 w-4 mr-1" />
      {isGenerating ? "Generating..." : `Generate Images${count > 0 ? ` (${count})` : ''}`}
    </Button>
  );
};

export default GeneratePropertyImagesButton;