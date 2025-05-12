import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bookmark, Home } from "lucide-react";
import { Property } from "@shared/schema";
import { Link } from "wouter";

interface PropertyCardProps {
  property: Property;
  onSave?: (propertyId: number) => void;
  isSaved?: boolean;
}

const PropertyCard = ({ property, onSave, isSaved = false }: PropertyCardProps) => {
  let images;
  try {
    // Handle both already parsed arrays and JSON strings
    images = typeof property.images === 'string' 
      ? JSON.parse(property.images) 
      : property.images;
  } catch (error) {
    console.error("Error parsing images:", error);
    images = [];
  }
  
  const mainImage = images && images.length > 0 ? images[0] : null;

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSave) {
      onSave(property.id);
    }
  };

  return (
    <Link href={`/properties/${property.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full border border-slate-200 bg-white">
        <div className="relative">
          {mainImage ? (
            <img
              src={mainImage}
              alt={property.address}
              className="h-48 w-full object-cover"
            />
          ) : (
            <div className="h-48 w-full bg-slate-100 flex items-center justify-center">
              <Home className="h-12 w-12 text-slate-400" />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <Button
              variant="secondary"
              size="icon"
              className={`rounded-full ${isSaved ? 'bg-blue-500 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
              onClick={handleSaveClick}
            >
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between mb-2">
            <div className="font-semibold text-lg text-slate-900">${Number(property.price).toLocaleString()}</div>
            <StatusBadge status={property.status} />
          </div>

          <h3 className="font-medium text-slate-800 truncate">{property.address}</h3>
          <p className="text-sm text-slate-600 truncate">
            {property.neighborhood ? `${property.neighborhood}, ` : ''}
            {property.city}, {property.state}
          </p>

          <div className="flex justify-between mt-3 text-sm text-slate-700 font-medium">
            <div className="flex items-center">
              <span className="bg-slate-100 px-2 py-1 rounded">{property.bedrooms} bed</span>
            </div>
            <div className="flex items-center">
              <span className="bg-slate-100 px-2 py-1 rounded">{property.bathrooms} bath</span>
            </div>
            <div className="flex items-center">
              <span className="bg-slate-100 px-2 py-1 rounded">{Number(property.squareFeet).toLocaleString()} sqft</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  // Ensure we have a valid status string
  const statusText = status?.toString() || 'Unknown';
  
  switch (statusText.toLowerCase()) {
    case 'active':
      return (
        <Badge className="bg-green-600 text-white hover:bg-green-700">
          Active
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-amber-500 text-white hover:bg-amber-600">
          Pending
        </Badge>
      );
    case 'sold':
      return (
        <Badge className="bg-slate-600 text-white hover:bg-slate-700">
          Sold
        </Badge>
      );
    default:
      return (
        <Badge className="bg-blue-600 text-white hover:bg-blue-700">
          {statusText}
        </Badge>
      );
  }
};

export default PropertyCard;
