import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Property } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Download as DownloadIcon, FileText as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface PropertyComparisonTableProps {
  properties: Property[];
  onRemoveProperty?: (propertyId: number) => void;
}

const PropertyComparisonTable = ({ properties, onRemoveProperty }: PropertyComparisonTableProps) => {
  if (!properties || properties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/70">No properties selected for comparison.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate property stats
  const calculatePropertyStats = (property: Property) => {
    const pricePerSqFt = Number(property.price) / Number(property.squareFeet);
    return {
      pricePerSqFt: formatCurrency(pricePerSqFt),
      pricePerBed: formatCurrency(Number(property.price) / Number(property.bedrooms)),
      pricePerBath: formatCurrency(Number(property.price) / Number(property.bathrooms)),
      priceVsAvg: 'N/A', // This would need market data for comparison
    };
  };

  const handleExportComparison = () => {
    // This would normally generate a PDF/Excel report
    console.log('Exporting comparison for properties:', properties.map(p => p.id));
    alert('Comparison report export started. The report will be downloaded shortly.');
  };

  return (
    <Card className="shadow-md bg-slate-900 border-slate-800 text-white">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-bold text-white">Property Comparison</CardTitle>
            <CardDescription className="text-white/70">
              Side-by-side comparison of {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1 text-white border-[#FF7A00]/30 bg-[#FF7A00]/10 hover:bg-[#FF7A00]/20 hover:border-[#FF7A00]/50"
            onClick={handleExportComparison}
          >
            <DownloadIcon size={16} />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="text-white">
            <TableHeader>
              <TableRow className="bg-slate-800 border-slate-700">
                <TableHead className="w-[200px] font-bold text-white">Feature</TableHead>
                {properties.map((property) => (
                  <TableHead key={property.id} className="min-w-[200px]">
                    <div className="flex flex-col">
                      <div className="font-bold truncate max-w-[180px] text-[#FF7A00]">
                        {property.address}
                      </div>
                      <div className="text-xs text-white/70 truncate">
                        {property.city}, {property.state} {property.zipCode}
                      </div>
                      {onRemoveProperty && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-1 p-0 h-6 text-white/70 hover:text-[#FF7A00] self-end"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveProperty(property.id);
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Basic Information */}
              <TableRow>
                <TableCell className="font-medium text-white/90">Price</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-price`}>
                    <span className="font-semibold text-[#FF7A00]">
                      {formatCurrency(Number(property.price))}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-white/90">Property Type</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-type`}>{property.propertyType}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-white/90">Status</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-status`}>
                    <span 
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        property.status === 'Active' 
                          ? 'bg-green-900 text-green-300' 
                          : property.status === 'Pending' 
                          ? 'bg-amber-900 text-amber-300' 
                          : 'bg-blue-900 text-blue-300'
                      }`}
                    >
                      {property.status}
                    </span>
                  </TableCell>
                ))}
              </TableRow>

              {/* Key Stats */}
              <TableRow>
                <TableCell className="font-medium text-white/90">Bedrooms</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-bedrooms`}>{property.bedrooms}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-white/90">Bathrooms</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-bathrooms`}>{property.bathrooms}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-white/90">Square Feet</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-sqft`}>
                    <span className="text-white/90 font-medium">
                      {formatNumber(Number(property.squareFeet))}
                    </span>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-white/90">Year Built</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-year`}>
                    {property.yearBuilt || 'N/A'}
                  </TableCell>
                ))}
              </TableRow>

              {/* Advanced Metrics */}
              <TableRow>
                <TableCell className="font-medium text-white/90">Price/SqFt</TableCell>
                {properties.map((property) => {
                  const stats = calculatePropertyStats(property);
                  return (
                    <TableCell key={`${property.id}-price-sqft`}>
                      <span className="text-[#FF7A00]">{stats.pricePerSqFt}</span>
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-white/90">Price/Bedroom</TableCell>
                {properties.map((property) => {
                  const stats = calculatePropertyStats(property);
                  return (
                    <TableCell key={`${property.id}-price-bed`}>
                      <span className="text-[#FF7A00]">{stats.pricePerBed}</span>
                    </TableCell>
                  );
                })}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-white/90">Days on Market</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-dom`}>
                    {property.daysOnMarket || 'N/A'}
                  </TableCell>
                ))}
              </TableRow>

              {/* Features */}
              <TableRow>
                <TableCell className="font-medium text-white/90">Basement</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-basement`}>
                    {property.hasBasement ? 'Yes' : 'No'}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-white/90">Garage</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-garage`}>
                    {property.hasGarage ? `Yes (${property.garageSpaces || 1} spaces)` : 'No'}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-white/90">Lot Size</TableCell>
                {properties.map((property) => (
                  <TableCell key={`${property.id}-lot`}>
                    {property.lotSize ? `${property.lotSize} acres` : 'N/A'}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyComparisonTable;