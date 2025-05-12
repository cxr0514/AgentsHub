import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Share2, Copy, Users, Trash2, ExternalLink, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

// Define the types for our data
interface SharedProperty {
  id: number;
  propertyId: number;
  property?: Property;
  ownerId: number;
  createdAt: string;
  sharedWith: string;
  accessToken: string;
  hasAccessed: boolean | null;
  expiresAt: string | null;
  allowComments: boolean | null;
  notes: string | null;
}

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  price: string;
  bedrooms: number;
  bathrooms: string;
  squareFeet: string;
  imageUrls?: string[];
  mainImageUrl?: string;
}

export default function SharedPropertiesPage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("shared-by-me");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareNotes, setShareNotes] = useState("");
  const [allowComments, setAllowComments] = useState(true);
  const [expiryDays, setExpiryDays] = useState(30);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      setLocation("/auth");
    }
  }, [user, setLocation]);

  // Fetch properties shared by the user
  const sharedByMeQuery = useQuery({
    queryKey: ["/api/collaboration/shared-by-me"],
    enabled: !!user
  });
  
  // Fetch properties shared with the user
  const sharedWithMeQuery = useQuery({
    queryKey: ["/api/collaboration/shared-with-me"],
    enabled: !!user
  });
  
  // Fetch user's properties to share (only fetch when share dialog is open)
  const userPropertiesQuery = useQuery({
    queryKey: ["/api/properties/my-properties"],
    enabled: shareDialogOpen && !!user
  });
  
  // Delete shared property mutation
  const deleteSharedPropertyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/collaboration/shared/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Failed to delete shared property");
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/shared-by-me"] });
      toast({
        title: "Property unshared",
        description: "The property is no longer shared",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Share property mutation
  const sharePropertyMutation = useMutation({
    mutationFn: async (data: {
      propertyId: number;
      sharedWith: string;
      notes?: string;
      allowComments: boolean;
      expiresAt?: string;
    }) => {
      const res = await fetch("/api/collaboration/share-property", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to share property");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/collaboration/shared-by-me"] });
      setShareDialogOpen(false);
      setShareEmail("");
      setShareNotes("");
      setSelectedProperty(null);
      toast({
        title: "Property shared",
        description: `Property has been shared with ${shareEmail}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sharing property",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleShareProperty = () => {
    if (!selectedProperty) return;
    
    // Calculate expiry date if days are set
    let expiresAt: string | undefined = undefined;
    if (expiryDays > 0) {
      const date = new Date();
      date.setDate(date.getDate() + expiryDays);
      expiresAt = date.toISOString();
    }
    
    sharePropertyMutation.mutate({
      propertyId: selectedProperty.id,
      sharedWith: shareEmail,
      notes: shareNotes || undefined,
      allowComments,
      expiresAt
    });
  };
  
  const copyShareLink = (token: string) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/shared/${token}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard"
    });
  };
  
  // Loading state
  if (!user) {
    return null; // Will redirect to auth
  }
  
  const isLoading = sharedByMeQuery.isLoading || sharedWithMeQuery.isLoading;
  const sharedByMe = sharedByMeQuery.data || [];
  const sharedWithMe = sharedWithMeQuery.data || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Property Sharing & Collaboration</h1>
      
      <Tabs defaultValue="shared-by-me" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="shared-by-me">Shared by Me</TabsTrigger>
          <TabsTrigger value="shared-with-me">Shared with Me</TabsTrigger>
        </TabsList>
        
        <TabsContent value="shared-by-me">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Properties You've Shared</h2>
            <Button 
              variant="default" 
              onClick={() => setShareDialogOpen(true)}
              disabled={shareDialogOpen}
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share a Property
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sharedByMe.length === 0 ? (
            <Alert className="mb-8">
              <AlertTitle>No shared properties</AlertTitle>
              <AlertDescription>
                You haven't shared any properties yet. Click "Share a Property" to get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedByMe.map((shared: SharedProperty) => (
                <Card key={shared.id} className="overflow-hidden flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-1">
                        {shared.property?.address || "Property"}
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => copyShareLink(shared.accessToken)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>
                      Shared with <span className="font-medium">{shared.sharedWith}</span>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-2 flex-grow">
                    {shared.property && (
                      <div className="text-sm mb-3">
                        <p>{shared.property.city}, {shared.property.state} {shared.property.zipCode}</p>
                        <p className="font-semibold">${shared.property.price}</p>
                        <p>{shared.property.bedrooms} bed · {shared.property.bathrooms} bath · {shared.property.squareFeet} sqft</p>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Shared on:</span>
                        <span>{format(new Date(shared.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      
                      {shared.expiresAt && (
                        <div className="flex justify-between">
                          <span>Expires:</span>
                          <span>{format(new Date(shared.expiresAt), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span>Link accessed:</span>
                        <span>{shared.hasAccessed ? 'Yes' : 'No'}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Comments allowed:</span>
                        <span>{shared.allowComments ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    
                    {shared.notes && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-muted-foreground">Your notes:</p>
                        <p className="text-sm mt-1 line-clamp-3">{shared.notes}</p>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="pt-2 flex justify-between">
                    <Button
                      variant="outline" 
                      size="sm"
                      asChild
                    >
                      <Link to={`/shared/${shared.accessToken}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteSharedPropertyMutation.mutate(shared.id)}
                      disabled={deleteSharedPropertyMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Unshare
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="shared-with-me">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Properties Shared with You</h2>
            <Button 
              variant="outline" 
              asChild
            >
              <Link to="/collaboration/teams">
                <Users className="mr-2 h-4 w-4" />
                Team Collaboration
              </Link>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sharedWithMe.length === 0 ? (
            <Alert className="mb-8">
              <AlertTitle>No shared properties</AlertTitle>
              <AlertDescription>
                No one has shared any properties with you yet.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedWithMe.map((shared: SharedProperty) => (
                <Card key={shared.id} className="overflow-hidden flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">
                      {shared.property?.address || "Property"}
                    </CardTitle>
                    <CardDescription>
                      Shared by <span className="font-medium">{shared.owner?.username || "User"}</span>
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-2 flex-grow">
                    {shared.property && (
                      <div className="text-sm mb-3">
                        <p>{shared.property.city}, {shared.property.state} {shared.property.zipCode}</p>
                        <p className="font-semibold">${shared.property.price}</p>
                        <p>{shared.property.bedrooms} bed · {shared.property.bathrooms} bath · {shared.property.squareFeet} sqft</p>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Shared on:</span>
                        <span>{format(new Date(shared.createdAt), 'MMM d, yyyy')}</span>
                      </div>
                      
                      {shared.expiresAt && (
                        <div className="flex justify-between">
                          <span>Expires:</span>
                          <span>{format(new Date(shared.expiresAt), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>
                    
                    {shared.notes && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-muted-foreground">Notes:</p>
                        <p className="text-sm mt-1 line-clamp-3">{shared.notes}</p>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="pt-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      asChild
                    >
                      <Link to={`/shared/${shared.accessToken}`}>
                        {shared.allowComments ? (
                          <>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            View & Comment
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Property
                          </>
                        )}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Share Property Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share a Property</DialogTitle>
            <DialogDescription>
              Share property details with collaborators or clients via email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="property" className="text-right">
                Property
              </Label>
              <div className="col-span-3">
                {userPropertiesQuery.isLoading ? (
                  <div className="flex items-center h-10">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading properties...</span>
                  </div>
                ) : (
                  <select 
                    id="property"
                    className="w-full p-2 border rounded-md"
                    onChange={(e) => {
                      const prop = userPropertiesQuery.data?.find(
                        (p: Property) => p.id === parseInt(e.target.value)
                      );
                      setSelectedProperty(prop || null);
                    }}
                    value={selectedProperty?.id || ""}
                  >
                    <option value="">Select a property</option>
                    {(userPropertiesQuery.data || []).map((property: Property) => (
                      <option key={property.id} value={property.id}>
                        {property.address}, {property.city}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Recipient Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                className="col-span-3"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Add a personalized note (optional)"
                className="col-span-3"
                value={shareNotes}
                onChange={(e) => setShareNotes(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiry" className="text-right">
                Expires After
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="expiry"
                  type="number"
                  min="0"
                  max="365"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  className="w-24"
                />
                <span>days (0 = never expires)</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comments" className="text-right">
                Allow Comments
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="comments"
                  checked={allowComments}
                  onCheckedChange={setAllowComments}
                />
                <Label htmlFor="comments">
                  Enable comments on this shared property
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleShareProperty}
              disabled={!selectedProperty || !shareEmail || sharePropertyMutation.isPending}
            >
              {sharePropertyMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Share Property
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}