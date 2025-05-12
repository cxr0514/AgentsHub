import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Key, Loader2, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// API key interface
interface ApiKey {
  id: string;
  name: string;
  key: string;
  service: string;
  createdAt: string;
}

// Form schema
const apiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  service: z.string().min(1, "Service is required"),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

export default function ApiKeyManagement() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);

  // Fetch API keys
  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ["/api/system/api-keys"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/system/api-keys");
      return res.json();
    },
  });

  // Form setup
  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: "",
      service: "",
    },
  });

  // Add API key mutation
  const addKeyMutation = useMutation({
    mutationFn: async (data: ApiKeyFormValues) => {
      const res = await apiRequest("POST", "/api/system/api-keys", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "API Key Added",
        description: "Your API key has been successfully created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system/api-keys"] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to Add API Key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      await apiRequest("DELETE", `/api/system/api-keys/${keyId}`);
    },
    onSuccess: () => {
      toast({
        title: "API Key Deleted",
        description: "The API key has been successfully removed",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system/api-keys"] });
      setKeyToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to Delete API Key",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ApiKeyFormValues) => {
    addKeyMutation.mutate(data);
  };

  // Handle key deletion
  const onDeleteKey = () => {
    if (keyToDelete) {
      deleteKeyMutation.mutate(keyToDelete.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  return (
    <div className="container mx-auto py-8 bg-[#071224] min-h-screen text-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">API Key Management</h1>
          <p className="text-gray-400">
            Manage your integration with external data providers
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#FF7A00] hover:bg-[#E56C00] text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0F1D32] border border-gray-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Add API Key</DialogTitle>
              <DialogDescription className="text-gray-300">
                Create a new API key to integrate with external services.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Name</FormLabel>
                      <FormControl>
                        <Input placeholder="MLS Provider" {...field} className="bg-[#162233] border-gray-700 text-white placeholder:text-gray-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="service"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Service</FormLabel>
                      <FormControl>
                        <Input placeholder="mls" {...field} className="bg-[#162233] border-gray-700 text-white placeholder:text-gray-500" />
                      </FormControl>
                      <FormMessage className="text-xs">
                        This will be used as environment variable prefix (e.g., MLS_API_KEY)
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={addKeyMutation.isPending}
                    className="bg-[#FF7A00] hover:bg-[#E56C00] text-white"
                  >
                    {addKeyMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Add API Key
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-[#0F1D32] border border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">API Keys</CardTitle>
          <CardDescription className="text-gray-300">
            Manage external service API keys for data integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF7A00]" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12 border border-gray-700 rounded-md bg-[#131F32]">
              <Key className="h-12 w-12 mx-auto text-[#FF7A00] mb-4" />
              <h3 className="text-lg font-medium text-white">No API Keys</h3>
              <p className="text-gray-400">
                You haven't added any API keys yet. Add one to get started.
              </p>
              <Button
                variant="outline"
                className="mt-4 border-gray-700 text-gray-300 hover:text-[#FF7A00] hover:bg-[#162233]"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#162233]">
                <TableRow className="border-gray-700 hover:bg-[#162233]">
                  <TableHead className="text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-300">Service</TableHead>
                  <TableHead className="text-gray-300">Key</TableHead>
                  <TableHead className="text-gray-300">Created</TableHead>
                  <TableHead className="w-[100px] text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey: ApiKey) => (
                  <TableRow key={apiKey.id} className="border-gray-700 hover:bg-[#162233]">
                    <TableCell className="font-medium text-white">{apiKey.name}</TableCell>
                    <TableCell className="uppercase text-gray-300">{apiKey.service}</TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center space-x-2">
                        <code className="bg-[#131F32] px-2 py-1 rounded text-xs text-gray-300">
                          {apiKey.key}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">{formatDate(apiKey.createdAt)}</TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setKeyToDelete(apiKey)}
                            className="hover:bg-[#162233] text-red-500 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-[#0F1D32] border border-gray-700 text-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">
                              Are you sure you want to delete this API key?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-300">
                              This action cannot be undone. Any services using this API key will
                              stop working immediately.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel 
                              onClick={() => setKeyToDelete(null)}
                              className="bg-[#162233] border-gray-700 text-white hover:bg-[#131F32] hover:text-gray-300"
                            >
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={onDeleteKey}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              {deleteKeyMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              )}
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}