import { useState } from "react";
import { Helmet } from "react-helmet";
import { generateFeaturesBenefitsPDF, generateTechnicalSpecPDF } from "@/lib/documentGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Settings, List, BarChart, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DocumentGenerator = () => {
  const { toast } = useToast();
  const [isGeneratingFeatures, setIsGeneratingFeatures] = useState(false);
  const [isGeneratingTech, setIsGeneratingTech] = useState(false);

  const handleGenerateFeaturesPDF = async () => {
    setIsGeneratingFeatures(true);
    try {
      const result = await generateFeaturesBenefitsPDF();
      toast({
        title: "PDF Generated Successfully",
        description: `Your "${result.filename}" has been downloaded.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error generating features PDF:", error);
      toast({
        title: "Failed to Generate PDF",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingFeatures(false);
    }
  };

  const handleGenerateTechSpecPDF = async () => {
    setIsGeneratingTech(true);
    try {
      const result = await generateTechnicalSpecPDF();
      toast({
        title: "PDF Generated Successfully",
        description: `Your "${result.filename}" has been downloaded.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error generating technical PDF:", error);
      toast({
        title: "Failed to Generate PDF",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingTech(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Document Generator | RealComp - Real Estate Comparison Tool</title>
        <meta 
          name="description" 
          content="Generate comprehensive documentation about RealComp's features and technical specifications." 
        />
      </Helmet>

      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Document Generator</h1>
          <p className="text-text-secondary">
            Generate professional documents for your RealComp platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <List className="h-5 w-5 mr-2" />
                Features & Benefits Document
              </CardTitle>
              <CardDescription>
                A comprehensive overview of RealComp's features and benefits for real estate professionals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-sm mb-2">Document Contents:</h3>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-start">
                      <ChevronRight className="h-4 w-4 mr-1 text-primary" />
                      <span>Platform overview and value proposition</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-4 w-4 mr-1 text-primary" />
                      <span>Key features and capabilities</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-4 w-4 mr-1 text-primary" />
                      <span>Benefits for real estate professionals</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-4 w-4 mr-1 text-primary" />
                      <span>Target audience breakdown</span>
                    </li>
                  </ul>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleGenerateFeaturesPDF}
                  disabled={isGeneratingFeatures}
                >
                  {isGeneratingFeatures ? (
                    <>
                      <span className="mr-2 animate-spin">◌</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generate Features & Benefits PDF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Technical Specifications Document
              </CardTitle>
              <CardDescription>
                Detailed technical specifications, hosting options, and implementation information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-sm mb-2">Document Contents:</h3>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-start">
                      <ChevronRight className="h-4 w-4 mr-1 text-primary" />
                      <span>System architecture and technology stack</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-4 w-4 mr-1 text-primary" />
                      <span>Hosting requirements and options</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-4 w-4 mr-1 text-primary" />
                      <span>External service dependencies (APIs)</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-4 w-4 mr-1 text-primary" />
                      <span>Managed hosting plans and pricing</span>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight className="h-4 w-4 mr-1 text-primary" />
                      <span>Implementation timeline and process</span>
                    </li>
                  </ul>
                </div>
                <Button 
                  className="w-full"
                  onClick={handleGenerateTechSpecPDF}
                  disabled={isGeneratingTech}
                >
                  {isGeneratingTech ? (
                    <>
                      <span className="mr-2 animate-spin">◌</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Technical Specifications PDF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-md mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              About RealComp Documentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-text-secondary">
              RealComp's documentation is designed to provide comprehensive information for both business and technical stakeholders. 
              These documents can be useful for presentations, client meetings, and implementation planning. All PDFs are generated 
              with the latest information about the platform and include professional formatting suitable for distribution.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DocumentGenerator;