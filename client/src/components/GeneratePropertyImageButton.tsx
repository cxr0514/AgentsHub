import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Image } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface GeneratePropertyImageButtonProps {
  propertyId: number;
  onComplete?: () => void;
}

const GeneratePropertyImageButton = ({ 
  propertyId, 
  onComplete 
}: GeneratePropertyImageButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerateImage = async () => {
    try {
      setIsGenerating(true);
      
      toast({
        title: "Generating property image",
        description: "This may take a moment. Please wait...",
      });
      
      const response = await apiRequest("POST", `/api/property-images/${propertyId}/generate`);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Image generated",
          description: "Property image has been created successfully",
          variant: "default",
        });
        
        // Call the onComplete callback to refresh the property data
        if (onComplete) {
          onComplete();
        }
      } else {
        throw new Error(data.message || "Failed to generate image");
      }
    } catch (error) {
      console.error("Error generating property image:", error);
      
      toast({
        title: "Error generating image",
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
      onClick={handleGenerateImage}
      disabled={isGenerating}
      className="flex items-center gap-1 bg-[#071224] border-[#0f1d31] text-slate-300 hover:bg-[#0f1d31] hover:text-white"
    >
      <Image className="h-4 w-4 mr-1 text-[#FF7A00]" />
      {isGenerating ? "Generating..." : "Generate Image"}
    </Button>
  );
};

export default GeneratePropertyImageButton;