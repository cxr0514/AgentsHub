import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
import { ImageUpload } from "./ImageUpload";

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
  const [createdPropertyId, setCreatedPropertyId] = useState<number | null>(null);
  const [showImageUploader, setShowImageUploader] = useState(false);
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
  
  const onSubmit = async (data: PropertyFormData) => {
    try {
      console.log("Form data:", data);
      
      // Convert string values to appropriate types for the API
      const propertyData = {
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        neighborhood: data.neighborhood || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        price: data.price, // Keep as string for numeric fields
        bedrooms: parseInt(data.bedrooms),
        bathrooms: data.bathrooms, // Keep as string for numeric fields
        squareFeet: data.squareFeet, // Keep as string for numeric fields
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
      
      console.log("Sending property data:", propertyData);
      
      try {
        const response = await fetch("/api/properties", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(propertyData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Server error:", errorData);
          throw new Error(errorData.message || "Failed to add property");
        }
        
        const newProperty = await response.json();
        console.log("Property added successfully:", newProperty);
        
        // Store the property ID for image uploads
        setCreatedPropertyId(newProperty.id);
        setShowImageUploader(true);
        
        toast({
          title: "Property Added",
          description: `Property created successfully! You can now add images.`,
        });
        
        // Invalidate properties query to refetch data
        queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
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
            Enter the details of the property you want to add to the database.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
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
                        <Input placeholder="123 Main St" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
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
                          <Input placeholder="Atlanta" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
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
                          <Input placeholder="GA" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
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
                          <Input placeholder="30066" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
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
                          <Input placeholder="Optional" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
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
                          <Input placeholder="Optional" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
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
                          <Input placeholder="Optional" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
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
                        <Input type="number" placeholder="450000" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
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
                          <Input type="number" placeholder="3" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
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
                          <Input type="number" placeholder="2" step="0.5" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
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
                          <Input type="number" placeholder="2000" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
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
                          <Input type="number" placeholder="Optional" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
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
                          <Input type="number" placeholder="Optional" step="0.01" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
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
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#071224] border-[#0f1d31] text-white">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#071224] border-[#0f1d31] text-white">
                            <SelectItem value="Single Family">Single Family</SelectItem>
                            <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                            <SelectItem value="Condo">Condo</SelectItem>
                            <SelectItem value="Townhouse">Townhouse</SelectItem>
                            <SelectItem value="Apartment">Apartment</SelectItem>
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
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#071224] border-[#0f1d31] text-white">
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
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Additional Information</h3>
                
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="hasBasement"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="data-[state=checked]:bg-[#FF7A00]"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">Has Basement</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="hasGarage"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            className="data-[state=checked]:bg-[#FF7A00]"
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">Has Garage</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="garageSpaces"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Garage Spaces</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Optional" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch("status") === "Active" && (
                  <FormField
                    control={form.control}
                    name="daysOnMarket"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days on Market</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {form.watch("status") === "Sold" && (
                  <FormField
                    control={form.control}
                    name="saleDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sale Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Description</h3>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter property description" 
                          className="resize-none h-32 bg-[#071224] border-[#0f1d31] text-white placeholder:text-slate-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {!showImageUploader && (
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                  className="border-[#0f1d31] bg-[#071224] text-white hover:bg-[#0f1d31] hover:text-white"
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white">
                  Add Property
                </Button>
              </div>
            )}
          </form>
        </Form>
        
        {showImageUploader && createdPropertyId && (
          <div className="mt-6 border-t border-[#0f1d31] pt-6">
            <h3 className="text-lg font-medium text-white mb-4">Add Property Images</h3>
            <ImageUpload 
              propertyId={createdPropertyId} 
              buttonText="Select Images"
              onImagesUploaded={(images) => {
                // After successful image upload, close the dialog
                toast({
                  title: "Upload Complete",
                  description: `${images.length} images uploaded successfully.`,
                });
                setTimeout(() => {
                  setOpen(false);
                  form.reset();
                  setShowImageUploader(false);
                  setCreatedPropertyId(null);
                }, 2000);
              }}
            />
            <div className="flex justify-between mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  // Skip image upload and finish
                  setOpen(false);
                  form.reset();
                  setShowImageUploader(false);
                  setCreatedPropertyId(null);
                }}
                className="border-[#0f1d31] bg-[#071224] text-white hover:bg-[#0f1d31] hover:text-white"
              >
                Skip Image Upload
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}