import { useState } from "react";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Loader2, PlusCircle, Key, Trash2, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Interface for API Keys
interface ApiKey {
  id: string;
  name: string;
  key: string; // Will be masked
  service: string;
  createdAt: string;
}

// Form schema for adding new API keys
const apiKeyFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  key: z
    .string()
    .min(5, { message: "API key must be at least 5 characters" }),
  service: z
    .string()
    .min(2, { message: "Service name is required" }),
});

type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;

const ApiKeyManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  // Form setup
  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeyFormSchema),
    defaultValues: {
      name: "",
      key: "",
      service: "",
    },
  });

  // Query to fetch API keys
  const { data: apiKeys, isLoading, refetch } = useQuery({
    queryKey: ["/api/system/api-keys"],
    refetchOnWindowFocus: false,
  });

  // Mutation to add a new API key
  const addKeyMutation = useMutation({
    mutationFn: (values: ApiKeyFormValues) =>
      apiRequest("POST", "/api/system/api-keys", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/api-keys"] });
      toast({
        title: "API Key Added",
        description: "The API key has been added successfully",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error Adding API Key",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Mutation to delete an API key
  const deleteKeyMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/system/api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/api-keys"] });
      toast({
        title: "API Key Deleted",
        description: "The API key has been removed successfully",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error Deleting API Key",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: ApiKeyFormValues) => {
    addKeyMutation.mutate(values);
  };

  // Handle API key deletion
  const handleDeleteKey = (id: string) => {
    setKeyToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  // Confirm API key deletion
  const confirmDelete = () => {
    if (keyToDelete) {
      deleteKeyMutation.mutate(keyToDelete);
    }
  };

  return (
    <>
      <Helmet>
        <title>API Key Management | RealComp - Real Estate Comparison Tool</title>
        <meta
          name="description"
          content="Manage API keys for external services and data integrations"
        />
      </Helmet>

      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">API Key Management</h1>
            <p className="text-muted-foreground">
              Manage API keys for external services and MLS data integrations
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* API Key Form */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PlusCircle className="mr-2 h-5 w-5" />
                Add New API Key
              </CardTitle>
              <CardDescription>
                Add a new API key for external service integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Environment Variable Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., MAPBOX_API_KEY" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          This will be used as the environment variable name
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="service"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mapbox">Mapbox</SelectItem>
                            <SelectItem value="mls">MLS Data Provider</SelectItem>
                            <SelectItem value="zillow">Zillow</SelectItem>
                            <SelectItem value="redfin">Redfin</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The service this API key belongs to
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter API key" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          The API key value (will be stored securely)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={addKeyMutation.isPending}
                  >
                    {addKeyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Add API Key
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* API Keys List */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="mr-2 h-5 w-5" />
                Stored API Keys
              </CardTitle>
              <CardDescription>
                Manage your existing API keys
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : apiKeys && apiKeys.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((apiKey: ApiKey) => (
                      <TableRow key={apiKey.id}>
                        <TableCell className="font-medium">{apiKey.name}</TableCell>
                        <TableCell>
                          <span className="capitalize">{apiKey.service}</span>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {apiKey.key}
                          </code>
                        </TableCell>
                        <TableCell>
                          {new Date(apiKey.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog
                            open={isDeleteDialogOpen && keyToDelete === apiKey.id}
                            onOpenChange={setIsDeleteDialogOpen}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteKey(apiKey.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete API Key</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the API key for {apiKey.name}?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={confirmDelete}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteKeyMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    "Delete"
                                  )}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No API keys found. Add your first API key to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>API Key Information</CardTitle>
            <CardDescription>
              Understanding how API keys are stored and used in RealComp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Storage</h3>
              <p className="text-muted-foreground text-sm">
                API keys are stored in a secure file and loaded as environment variables at
                server startup. The keys are never exposed to the client.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Required API Keys</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground pl-4 space-y-1">
                <li><strong>MAPBOX_API_KEY</strong> - Required for map functionality</li>
                <li><strong>MLS_API_KEY</strong> - Required for MLS data integration</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Security Notes</h3>
              <p className="text-muted-foreground text-sm">
                API keys are sensitive information. Never share your keys with unauthorized users or
                commit them to source control.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ApiKeyManagement;