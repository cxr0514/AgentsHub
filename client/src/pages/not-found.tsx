import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Key, Plus, Trash2, RefreshCw, Check, Copy, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";

type ApiKey = {
  id: string;
  name: string;
  key: string;
  service: string;
  createdAt: string;
};

export default function ApiKeysManager() {
  const { toast } = useToast();
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [newApiKeyValue, setNewApiKeyValue] = useState("");
  const [newApiKeyService, setNewApiKeyService] = useState("ATTOM");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isAddKeyDialogOpen, setIsAddKeyDialogOpen] = useState(false);

  const {
    data: apiKeys = [],
    isLoading,
    error,
    refetch
  } = useQuery<ApiKey[]>({
    queryKey: ["/api-keys"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api-keys");
      return res.json();
    }
  });

  const addKeyMutation = useMutation({
    mutationFn: async (newApiKey: { name: string; key: string; service: string }) => {
      const res = await apiRequest("POST", "/api-keys", newApiKey);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "API Key Added",
        description: "Your API key has been successfully added.",
        variant: "default",
      });
      setNewApiKeyName("");
      setNewApiKeyValue("");
      setIsAddKeyDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api-keys"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Adding API Key",
        description: error.message || "There was a problem adding your API key.",
        variant: "destructive",
      });
    }
  });

  const removeKeyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api-keys/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "API Key Removed",
        description: "The API key has been successfully removed.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api-keys"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Removing API Key",
        description: error.message || "There was a problem removing the API key.",
        variant: "destructive",
      });
    }
  });

  const handleAddApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApiKeyName || !newApiKeyValue || !newApiKeyService) {
      toast({
        title: "Missing Information",
        description: "Please provide a name, service, and API key value.",
        variant: "destructive",
      });
      return;
    }

    addKeyMutation.mutate({
      name: newApiKeyName,
      key: newApiKeyValue,
      service: newApiKeyService
    });
  };

  const toggleKeyVisibility = (id: string) => {
    setShowKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyKeyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      toast({
        title: "Copied to Clipboard",
        description: "API key has been copied to clipboard.",
        variant: "default",
      });
    });
  };

  const services = [
    { value: "ATTOM", label: "ATTOM Property Data API" },
    { value: "MLS", label: "MLS Real Estate API" },
    { value: "OPENAI", label: "OpenAI API (for AI features)" },
    { value: "PERPLEXITY", label: "Perplexity API (for market analysis)" }
  ];

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">API Keys Management</h1>
            <p className="text-slate-300 mt-1">
              Manage your API keys for third-party service integrations
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="border-[#0f1d31] bg-[#071224] hover:bg-[#0f1d31] text-slate-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={isAddKeyDialogOpen} onOpenChange={setIsAddKeyDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#050e1d] border-[#0f1d31] text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New API Key</DialogTitle>
                  <DialogDescription className="text-slate-300">
                    Enter the details for your new API key.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleAddApiKey} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="service" className="text-white">Service</Label>
                    <select
                      id="service"
                      value={newApiKeyService}
                      onChange={(e) => setNewApiKeyService(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-[#0f1d31] bg-[#071224] px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {services.map((service) => (
                        <option key={service.value} value={service.value}>
                          {service.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Key Name</Label>
                    <Input
                      id="name"
                      placeholder="Production ATTOM API Key"
                      value={newApiKeyName}
                      onChange={(e) => setNewApiKeyName(e.target.value)}
                      className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-400"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="key" className="text-white">API Key Value</Label>
                    <Input
                      id="key"
                      placeholder="Enter your API key"
                      value={newApiKeyValue}
                      onChange={(e) => setNewApiKeyValue(e.target.value)}
                      className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-400"
                    />
                  </div>
                  
                  <DialogFooter className="pt-4">
                    <Button 
                      type="submit" 
                      className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white"
                      disabled={addKeyMutation.isPending}
                    >
                      {addKeyMutation.isPending ? "Adding..." : "Add API Key"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Separator className="bg-[#0f1d31]" />
        
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load API keys. Please try again later.
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A00]"></div>
          </div>
        ) : apiKeys.length === 0 ? (
          <Card className="bg-[#050e1d] border-[#0f1d31] text-white">
            <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center min-h-[200px]">
              <Key className="h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No API Keys Found</h3>
              <p className="text-slate-300 text-center max-w-md mb-6">
                You haven't added any API keys yet. API keys allow the application to connect with external services.
              </p>
              <Button 
                onClick={() => setIsAddKeyDialogOpen(true)}
                className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id} className="bg-[#050e1d] border-[#0f1d31] overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-[#FF7A00]" />
                      <CardTitle className="text-white text-lg">{apiKey.name}</CardTitle>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-[#071224] text-slate-300">
                      {apiKey.service}
                    </span>
                  </div>
                  <CardDescription className="text-slate-400">
                    Added on {new Date(apiKey.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="relative flex-1">
                      <Input 
                        value={showKeys[apiKey.id] ? apiKey.key : "•".repeat(20)} 
                        readOnly 
                        className="pr-20 font-mono bg-[#071224] border-[#0f1d31] text-white"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-slate-400 hover:text-white hover:bg-[#0f1d31]"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {showKeys[apiKey.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7 text-slate-400 hover:text-white hover:bg-[#0f1d31]"
                          onClick={() => copyKeyToClipboard(apiKey.key)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => removeKeyMutation.mutate(apiKey.id)}
                      disabled={removeKeyMutation.isPending}
                      className="bg-red-900/30 hover:bg-red-900 text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <Separator className="bg-[#0f1d31]" />
        
        <div className="rounded-lg bg-[#071224] border border-[#0f1d31] p-4 text-slate-300 space-y-4">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-[#FF7A00]" />
            <h3 className="text-white font-medium">About API Keys</h3>
          </div>
          <p>
            API keys are used to authenticate requests to third-party services that provide data for this application.
            The following services are supported:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><span className="text-white font-medium">ATTOM Data API:</span> Provides property data, including sales history, tax information, and property characteristics.</li>
            <li><span className="text-white font-medium">MLS API:</span> Connects to Multiple Listing Service for real-time property listings and real estate data.</li>
            <li><span className="text-white font-medium">OpenAI API:</span> Powers AI features, including property description generation and image generation.</li>
            <li><span className="text-white font-medium">Perplexity API:</span> Used for advanced market analysis and AI-powered insights.</li>
          </ul>
          <p>API keys are stored securely and are only used for the intended service integration.</p>
        </div>
      </div>
    </div>
  );
}