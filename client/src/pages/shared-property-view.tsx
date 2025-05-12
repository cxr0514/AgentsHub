import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Home, 
  ArrowLeft, 
  Share2, 
  MessageSquare, 
  Send, 
  Clock, 
  Check, 
  AlertTriangle,
  Loader2,
  ArrowDown,
  Map,
  DollarSign,
  Ruler,
  Building,
  CalendarDays
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define the types for our data
interface SharedProperty {
  id: number;
  propertyId: number;
  property: Property;
  ownerId: number;
  owner: {
    id: number;
    username: string;
    email: string;
  };
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
  lotSize: string;
  yearBuilt: number;
  propertyType: string;
  description: string;
  features: string[];
  imageUrls: string[];
  mainImageUrl: string;
  latitude: number;
  longitude: number;
  status: string;
  listDate: string;
}

interface Comment {
  id: number;
  createdAt: string;
  propertyId: number;
  sharedPropertyId: number;
  userId: number | null;
  comment: string;
  commenterName: string | null;
  commenterEmail: string | null;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export default function SharedPropertyView() {
  const [, params] = useRoute("/shared/:token");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = params?.token;
  
  const [comment, setComment] = useState("");
  const [commenterName, setCommenterName] = useState("");
  const [commenterEmail, setCommenterEmail] = useState("");
  
  // Fetch shared property data
  const { data: sharedProperty, isLoading, error } = useQuery({
    queryKey: [`/api/collaboration/shared/${token}`],
    enabled: !!token,
    retry: false
  });
  
  // Fetch comments if allowed
  const { data: comments = [] } = useQuery({
    queryKey: [`/api/collaboration/shared/${token}/comments`],
    enabled: !!token && !!sharedProperty?.allowComments,
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentData: {
      comment: string;
      commenterName?: string;
      commenterEmail?: string;
    }) => {
      const res = await fetch(`/api/collaboration/shared/${token}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(commentData)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add comment");
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/collaboration/shared/${token}/comments`] });
      setComment("");
      setCommenterName("");
      setCommenterEmail("");
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleAddComment = () => {
    if (!comment) return;
    
    const commentData: any = { comment };
    
    // If not authenticated, provide name and email
    if (!user) {
      if (!commenterName || !commenterEmail) {
        toast({
          title: "Missing information",
          description: "Please provide your name and email to add a comment",
          variant: "destructive"
        });
        return;
      }
      commentData.commenterName = commenterName;
      commentData.commenterEmail = commenterEmail;
    }
    
    addCommentMutation.mutate(commentData);
  };
  
  // Check if link is expired
  const isExpired = sharedProperty?.expiresAt 
    ? new Date(sharedProperty.expiresAt) < new Date() 
    : false;
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading shared property...</p>
      </div>
    );
  }
  
  if (error || !sharedProperty) {
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Invalid or Expired Link</AlertTitle>
          <AlertDescription>
            This shared property link is invalid or has expired. Please request a new link from the sender.
          </AlertDescription>
        </Alert>
        
        <Button className="mt-8" variant="outline" onClick={() => setLocation("/")}>
          <Home className="mr-2 h-4 w-4" />
          Return to Home
        </Button>
      </div>
    );
  }
  
  if (isExpired) {
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center">
        <Alert variant="destructive" className="max-w-lg mx-auto">
          <Clock className="h-4 w-4" />
          <AlertTitle>Link Expired</AlertTitle>
          <AlertDescription>
            This shared property link has expired. Please request a new link from the sender.
          </AlertDescription>
        </Alert>
        
        <Button className="mt-8" variant="outline" onClick={() => setLocation("/")}>
          <Home className="mr-2 h-4 w-4" />
          Return to Home
        </Button>
      </div>
    );
  }
  
  const property = sharedProperty.property;
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Badge variant="outline" className="bg-primary/10">
              Shared Property
            </Badge>
          </div>
          
          <h1 className="text-3xl font-bold">{property.address}</h1>
          <p className="text-xl text-muted-foreground">
            {property.city}, {property.state} {property.zipCode}
          </p>
        </div>
        
        <div className="flex flex-col items-end">
          <p className="text-sm text-muted-foreground mb-1">
            Shared by <span className="font-medium">{sharedProperty.owner?.username || "User"}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="inline-flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Shared on {new Date(sharedProperty.createdAt).toLocaleDateString()}
            </span>
          </p>
        </div>
      </div>
      
      {sharedProperty.notes && (
        <Alert className="mb-6">
          <AlertTitle>Message from sender:</AlertTitle>
          <AlertDescription>
            {sharedProperty.notes}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="aspect-video bg-muted rounded-md overflow-hidden">
                  {property.mainImageUrl ? (
                    <img 
                      src={property.mainImageUrl} 
                      alt={property.address} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Home className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold mb-2">${property.price}</h2>
                  
                  <div className="grid grid-cols-2 gap-y-4 mb-6">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{property.propertyType}</span>
                    </div>
                    <div className="flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Built {property.yearBuilt}</span>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline">{property.bedrooms} beds</Badge>
                    </div>
                    <div className="flex items-center">
                      <Badge variant="outline">{property.bathrooms} baths</Badge>
                    </div>
                    <div className="flex items-center">
                      <Ruler className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{property.squareFeet} sqft</span>
                    </div>
                    <div className="flex items-center">
                      <Map className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{property.lotSize} lot</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {property.description}
                </p>
              </div>
              
              {property.features && property.features.length > 0 && (
                <>
                  <Separator className="my-6" />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Features</h3>
                    <ul className="grid grid-cols-2 gap-2">
                      {property.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {sharedProperty.allowComments && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Discussion
                </CardTitle>
                <CardDescription>
                  Share your thoughts about this property
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4 mb-6">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p>No comments yet. Be the first to share your thoughts!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment: Comment) => (
                        <div key={comment.id} className="flex gap-3 pb-4 border-b">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {comment.user?.username?.charAt(0) || 
                               comment.commenterName?.charAt(0) || 
                               'U'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {comment.user?.username || comment.commenterName || "Anonymous"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm">{comment.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <Textarea
                    placeholder="Write your comment here..."
                    className="min-h-[100px]"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  
                  {!user && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name</Label>
                        <Input
                          id="name"
                          placeholder="Enter your name"
                          value={commenterName}
                          onChange={(e) => setCommenterName(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Your Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={commenterEmail}
                          onChange={(e) => setCommenterEmail(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleAddComment}
                      disabled={!comment || addCommentMutation.isPending}
                    >
                      {addCommentMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Post Comment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {sharedProperty.owner?.username?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{sharedProperty.owner?.username || "User"}</p>
                  <p className="text-sm text-muted-foreground">{sharedProperty.owner?.email}</p>
                </div>
              </div>
              
              {user && user.id !== sharedProperty.ownerId && (
                <Button className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Contact Sender
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}