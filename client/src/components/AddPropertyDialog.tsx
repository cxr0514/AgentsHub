import { useState, useRef, ChangeEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Image as ImageIcon, X } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPropertySchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

// Create a schema for property creation form with more specific validations
const propertyFormSchema = z.object({
  address: z.string().min(3, "Address is required and must be at least 3 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().min(5, "Zip code is required"),
  neighborhood: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  bedrooms: z.string().min(1, "Number of bedrooms is required"),
  bathrooms: z.string().min(1, "Number of bathrooms is required"),
  squareFeet: z.string().min(1, "Square footage is required"),
  lotSize: z.string().optional(),
  yearBuilt: z.string().optional(),
  propertyType: z.string().min(1, "Property type is required"),
  status: z.string().min(1, "Status is required"),
  daysOnMarket: z.string().optional(),
  saleDate: z.string().optional(),
  hasBasement: z.boolean().default(false),
  hasGarage: z.boolean().default(false),
  garageSpaces: z.string().optional(),
  pricePerSqft: z.string().optional(),
  description: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertyFormSchema>;

interface AddPropertyDialogProps {
  onAddSuccess?: () => void;
}

export default function AddPropertyDialog({ onAddSuccess }: AddPropertyDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("details");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      address: "",
      city: "",
      state: "",
      zipCode: "",
      neighborhood: "",
      latitude: "",
      longitude: "",
      price: "",
      bedrooms: "",
      bathrooms: "",
      squareFeet: "",
      lotSize: "",
      yearBuilt: "",
      propertyType: "Single Family",
      status: "Active",
      daysOnMarket: "0",
      saleDate: "",
      hasBasement: false,
      hasGarage: false,
      garageSpaces: "",
      pricePerSqft: "",
      description: "",
    },
  });
  
  // Handle file selection button click
  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    
    // Generate preview URLs for the selected images
    const newPreviewUrls = fileArray.map(file => URL.createObjectURL(file));
    
    // Update the state with selected files and preview URLs
    setSelectedImages(prevImages => [...prevImages, ...fileArray]);
    setPreviewImages(prevUrls => [...prevUrls, ...newPreviewUrls]);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove an image from the selection
  const removeImage = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(previewImages[index]);
    
    // Remove the image from both arrays
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Upload images for a property
  const uploadImages = async (propertyId: number, images: File[]) => {
    if (!propertyId || images.length === 0) return [];
    
    try {
      const formData = new FormData();
      for (const image of images) {
        formData.append('images', image);
      }
      
      const response = await fetch(`/api/properties/${propertyId}/images`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload images");
      }
      
      const result = await response.json();
      return result.images;
    } catch (error) {
      console.error("Error uploading images:", error);
      throw error;
    }
  };
  
  const onSubmit = async (data: PropertyFormData) => {
    try {
      setUploading(true);
      
      // Convert string values to appropriate types for the API
      const propertyData = {
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        neighborhood: data.neighborhood || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        price: data.price,
        bedrooms: parseInt(data.bedrooms),
        bathrooms: data.bathrooms,
        squareFeet: data.squareFeet,
        lotSize: data.lotSize || null,
        yearBuilt: data.yearBuilt ? parseInt(data.yearBuilt) : null,
        propertyType: data.propertyType,
        status: data.status,
        daysOnMarket: data.daysOnMarket ? parseInt(data.daysOnMarket) : null,
        saleDate: data.saleDate ? new Date(data.saleDate).toISOString() : null,
        hasBasement: data.hasBasement,
        hasGarage: data.hasGarage,
        garageSpaces: data.garageSpaces ? parseInt(data.garageSpaces) : null,
        pricePerSqft: data.pricePerSqft || null,
        description: data.description || null,
        features: ["Added manually"],
        images: [],
      };
      
      try {
        // Step 1: Create the property
        const response = await fetch("/api/properties", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(propertyData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to add property");
        }
        
        const newProperty = await response.json();
        let successMessage = "Property created successfully!";
        
        // Step 2: Upload images if any are selected
        if (selectedImages.length > 0) {
          try {
            toast({
              title: "Uploading Images",
              description: `Uploading ${selectedImages.length} images...`,
            });
            
            const uploadedImages = await uploadImages(newProperty.id, selectedImages);
            
            // Clean up preview URLs to prevent memory leaks
            previewImages.forEach(url => URL.revokeObjectURL(url));
            
            successMessage = `Property created successfully with ${uploadedImages.length} images!`;
          } catch (imageError) {
            console.error("Image upload error:", imageError);
            successMessage += " (But there was an error uploading images)";
            toast({
              title: "Image Upload Error",
              description: imageError instanceof Error ? imageError.message : "Failed to upload images",
              variant: "destructive",
            });
          }
        }
        
        toast({
          title: "Property Added",
          description: successMessage,
        });
        
        // Invalidate properties query to refetch data
        queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
        
        // Reset form and state
        form.reset();
        setSelectedImages([]);
        setPreviewImages([]);
        setActiveTab("details");
        setOpen(false);
        
      } catch (apiError) {
        console.error("API request error:", apiError);
        toast({
          title: "Error Adding Property",
          description: apiError instanceof Error ? apiError.message : "Server error occurred",
          variant: "destructive",
        });
      }
      
      // Call success callback if provided
      if (onAddSuccess) {
        onAddSuccess();
      }
    } catch (error) {
      toast({
        title: "Error Adding Property",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#050e1d] border-[#0f1d31] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Add New Property</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter details and add images for the property you want to add.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full mt-2"
        >
          <TabsList className="grid grid-cols-2 mb-4 bg-[#071224] border border-[#0f1d31] p-1">
            <TabsTrigger 
              value="details" 
              className="rounded data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white"
            >
              Property Details
            </TabsTrigger>
            <TabsTrigger 
              value="images" 
              className="rounded data-[state=active]:bg-[#FF7A00] data-[state=active]:text-white"
            >
              Images {selectedImages.length > 0 && `(${selectedImages.length})`}
            </TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              <TabsContent value="details" className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Location Information</h3>
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-200">Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00] placeholder:text-slate-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="Atlanta" {...field} className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00] placeholder:text-slate-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input placeholder="GA" {...field} className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00] placeholder:text-slate-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zip Code</FormLabel>
                            <FormControl>
                              <Input placeholder="30066" {...field} className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00] placeholder:text-slate-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Neighborhood</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional" {...field} className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00] placeholder:text-slate-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional" {...field} className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00] placeholder:text-slate-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional" {...field} className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00] placeholder:text-slate-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Property Details</h3>
                    
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price ($)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="450000" {...field} className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00] placeholder:text-slate-500" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-3 gap-3">
                      <FormField
                        control={form.control}
                        name="bedrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bedrooms</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="3" {...field} className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00] placeholder:text-slate-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="bathrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bathrooms</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="2" step="0.5" {...field} className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00] placeholder:text-slate-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="squareFeet"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sq Ft</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="2000" {...field} className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00] placeholder:text-slate-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="yearBuilt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year Built</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Optional" {...field} className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00] placeholder:text-slate-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lotSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lot Size (acres)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Optional" step="0.01" {...field} className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00] placeholder:text-slate-500" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="propertyType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property Type</FormLabel>
                            <Select
                              defaultValue={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00]">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-[#071224] border-[#0f1d31] text-white">
                                <SelectItem value="Single Family">Single Family</SelectItem>
                                <SelectItem value="Condo">Condo</SelectItem>
                                <SelectItem value="Townhouse">Townhouse</SelectItem>
                                <SelectItem value="Multi Family">Multi Family</SelectItem>
                                <SelectItem value="Land">Land</SelectItem>
                                <SelectItem value="Commercial">Commercial</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              defaultValue={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00]">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-[#071224] border-[#0f1d31] text-white">
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Sold">Sold</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="hasBasement"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#0f1d31] p-3 shadow-sm bg-[#071224]">
                            <div className="space-y-0.5">
                              <FormLabel>Has Basement</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-[#FF7A00]"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="hasGarage"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-[#0f1d31] p-3 shadow-sm bg-[#071224]">
                            <div className="space-y-0.5">
                              <FormLabel>Has Garage</FormLabel>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-[#FF7A00]"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter property description here..."
                            {...field}
                            className="bg-[#071224] border-[#0f1d31] text-white focus:ring-[#FF7A00] focus:border-[#FF7A00] placeholder:text-slate-500 min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="images" className="mt-0">
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={handleFileButtonClick}
                      disabled={uploading}
                      className="bg-[#071224] text-white border-[#0f1d31] hover:bg-[#0f1d31]"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Select Images
                    </Button>
                    
                    {selectedImages.length > 0 ? (
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Selected Images ({selectedImages.length})</h3>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                          {previewImages.map((src, index) => (
                            <Card key={index} className="overflow-hidden bg-[#071224] border-[#0f1d31]">
                              <CardContent className="p-2 relative">
                                <div className="relative aspect-square">
                                  <img 
                                    src={src} 
                                    alt={`Preview ${index + 1}`} 
                                    className="object-cover w-full h-full rounded-sm"
                                  />
                                  <button
                                    type="button"
                                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                                    onClick={() => removeImage(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center border border-dashed rounded-md p-8 border-[#0f1d31] mt-2">
                        <div className="flex flex-col items-center text-slate-400">
                          <ImageIcon className="h-8 w-8 mb-2" />
                          <p className="text-sm">No images selected</p>
                          <p className="text-xs mt-1">Add photos to showcase this property</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-slate-400 mt-4 p-3 bg-[#0d1728] rounded-md border border-[#0f1d31]">
                    <p>📷 <strong>Image tips:</strong></p>
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>Add high-quality photos (max 10MB per image)</li>
                      <li>Include exterior, interior, and unique features</li>
                      <li>Good photos increase property visibility and interest</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
              
              <div className="flex justify-end space-x-2 pt-4 border-t border-[#0f1d31]">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    // Clean up previews
                    previewImages.forEach(url => URL.revokeObjectURL(url));
                    setPreviewImages([]);
                    setSelectedImages([]);
                    form.reset();
                  }} 
                  className="border-[#0f1d31] text-white hover:bg-[#071224] hover:text-white"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white"
                  disabled={uploading}
                >
                  {uploading ? "Creating Property..." : "Add Property"}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}