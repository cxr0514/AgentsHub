import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { properties, comparables } from '../data';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { autoTable } from 'jspdf-autotable';

interface Comparable {
  id: number;
  subjectPropertyId: number;
  address: string;
  city: string;
  state: string;
  price: number;
  saleDate: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  year_built: number;
  distance_miles: number;
  adjusted_price: number;
  adjustments: Array<{factor: string, amount: number}>;
  image?: string;
}

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  images?: string[];
  // Additional properties as needed
}

const CMAReportGenerator: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedComps, setSelectedComps] = useState<Comparable[]>([]);
  const [availableComps, setAvailableComps] = useState<Comparable[]>([]);

  // Load available properties from mock data
  const availableProperties = properties;

  // When a property is selected, find the available comparables
  useEffect(() => {
    if (selectedProperty) {
      const propertyComps = comparables.filter(
        comp => comp.subjectPropertyId === selectedProperty.id
      );
      setAvailableComps(propertyComps);
    } else {
      setAvailableComps([]);
    }
  }, [selectedProperty]);

  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    setSelectedComps([]);
    setStep(2);
  };

  const handleSelectComp = (comp: Comparable) => {
    if (selectedComps.find(c => c.id === comp.id)) {
      setSelectedComps(selectedComps.filter(c => c.id !== comp.id));
    } else {
      setSelectedComps([...selectedComps, comp]);
    }
  };

  const handleGeneratePDF = () => {
    if (!selectedProperty) return;
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Comparative Market Analysis (CMA) Report', 14, 22);
    
    // Add subject property details
    doc.setFontSize(14);
    doc.text('Subject Property', 14, 35);
    
    doc.setFontSize(12);
    doc.text(`Address: ${selectedProperty.address}, ${selectedProperty.city}, ${selectedProperty.state}`, 14, 45);
    doc.text(`Price: $${selectedProperty.price.toLocaleString()}`, 14, 52);
    doc.text(`Bedrooms: ${selectedProperty.bedrooms}`, 14, 59);
    doc.text(`Bathrooms: ${selectedProperty.bathrooms}`, 14, 66);
    doc.text(`Square Feet: ${selectedProperty.square_feet}`, 14, 73);
    
    // Add comparable properties table
    doc.setFontSize(14);
    doc.text('Comparable Properties', 14, 90);
    
    const tableData = selectedComps.map(comp => [
      comp.address,
      `$${comp.price.toLocaleString()}`,
      `$${comp.adjusted_price.toLocaleString()}`,
      comp.distance_miles.toFixed(2)
    ]);
    
    const tableResult = autoTable(doc, {
      head: [['Address', 'Sale Price', 'Adjusted Price', 'Distance (mi)']],
      body: tableData,
      startY: 100,
    });
    
    // Calculate market value based on comparables
    const avgAdjPrice = selectedComps.reduce((sum, comp) => sum + comp.adjusted_price, 0) / selectedComps.length;
    
    const finalY = tableResult.finalY || 150;
    
    doc.setFontSize(14);
    doc.text('Estimated Market Value', 14, finalY + 20);
    
    doc.setFontSize(12);
    doc.text(`$${Math.round(avgAdjPrice).toLocaleString()}`, 14, finalY + 30);
    
    // Save the PDF
    doc.save('CMA_Report.pdf');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">CMA Report Generator</h1>
      
      {/* Step indicators */}
      <div className="flex mb-8">
        <div className={`flex-1 text-center p-2 ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Step 1: Select Subject Property
        </div>
        <div className={`flex-1 text-center p-2 ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Step 2: Select Comparables
        </div>
        <div className={`flex-1 text-center p-2 ${step === 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Step 3: Adjust Comparables
        </div>
        <div className={`flex-1 text-center p-2 ${step === 4 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
          Step 4: Preview & Download
        </div>
      </div>
      
      {/* Step 1: Select Subject Property */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Subject Property</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableProperties.map((property) => (
              <Card 
                key={property.id} 
                className={`cursor-pointer hover:shadow-lg ${selectedProperty?.id === property.id ? 'border-2 border-blue-500' : ''}`}
                onClick={() => handleSelectProperty(property)}
              >
                <CardContent className="p-4">
                  <div className="font-semibold">{property.address}</div>
                  <div>{property.city}, {property.state}</div>
                  <div className="text-lg font-bold">${property.price.toLocaleString()}</div>
                  <div>{property.bedrooms} beds, {property.bathrooms} baths</div>
                  <div>{property.square_feet} sq ft</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Step 2: Select Comparables */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Comparable Properties</h2>
          {availableComps.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {availableComps.map((comp) => (
                  <Card 
                    key={comp.id} 
                    className={`cursor-pointer hover:shadow-lg ${selectedComps.find(c => c.id === comp.id) ? 'border-2 border-green-500' : ''}`}
                    onClick={() => handleSelectComp(comp)}
                  >
                    <CardContent className="p-4">
                      <div className="font-semibold">{comp.address}</div>
                      <div>{comp.city}, {comp.state}</div>
                      <div className="text-lg font-bold">${comp.price.toLocaleString()}</div>
                      <div>{comp.bedrooms} beds, {comp.bathrooms} baths</div>
                      <div>{comp.square_feet} sq ft</div>
                      <div>Distance: {comp.distance_miles.toFixed(2)} mi</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex justify-between">
                <Button onClick={() => setStep(1)}>Back</Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={selectedComps.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="mb-4">No comparable properties found for this subject property.</p>
              <Button onClick={() => setStep(1)}>Back to Property Selection</Button>
            </div>
          )}
        </div>
      )}
      
      {/* Step 3: Adjust Comparables */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Adjust Comparables</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border">Address</th>
                  <th className="py-2 px-4 border">Sale Price</th>
                  <th className="py-2 px-4 border">Adjustments</th>
                  <th className="py-2 px-4 border">Adjusted Price</th>
                </tr>
              </thead>
              <tbody>
                {selectedComps.map((comp) => (
                  <tr key={comp.id}>
                    <td className="py-2 px-4 border">{comp.address}</td>
                    <td className="py-2 px-4 border">${comp.price.toLocaleString()}</td>
                    <td className="py-2 px-4 border">
                      {comp.adjustments.map((adj, index) => (
                        <div key={index}>
                          {adj.factor}: ${adj.amount.toLocaleString()}
                        </div>
                      ))}
                    </td>
                    <td className="py-2 px-4 border">${comp.adjusted_price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between mt-6">
            <Button onClick={() => setStep(2)}>Back</Button>
            <Button 
              onClick={() => setStep(4)} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue
            </Button>
          </div>
        </div>
      )}
      
      {/* Step 4: Preview & Download */}
      {step === 4 && selectedProperty && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Preview & Download</h2>
          <div className="bg-white p-6 border rounded-lg mb-6">
            <h3 className="text-xl font-bold mb-4">Comparative Market Analysis (CMA) Report</h3>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">Subject Property</h4>
              <p className="mb-1">{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state}</p>
              <p className="mb-1">Price: ${selectedProperty.price.toLocaleString()}</p>
              <p className="mb-1">Bedrooms: {selectedProperty.bedrooms}</p>
              <p className="mb-1">Bathrooms: {selectedProperty.bathrooms}</p>
              <p className="mb-1">Square Feet: {selectedProperty.square_feet}</p>
            </div>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">Comparable Properties</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border">Address</th>
                      <th className="py-2 px-4 border">Sale Price</th>
                      <th className="py-2 px-4 border">Adjusted Price</th>
                      <th className="py-2 px-4 border">Distance (mi)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedComps.map((comp) => (
                      <tr key={comp.id}>
                        <td className="py-2 px-4 border">{comp.address}</td>
                        <td className="py-2 px-4 border">${comp.price.toLocaleString()}</td>
                        <td className="py-2 px-4 border">${comp.adjusted_price.toLocaleString()}</td>
                        <td className="py-2 px-4 border">{comp.distance_miles.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-2">Estimated Market Value</h4>
              <p className="text-xl font-bold">
                ${Math.round(selectedComps.reduce((sum, comp) => sum + comp.adjusted_price, 0) / selectedComps.length).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button onClick={() => setStep(3)}>Back</Button>
            <Button 
              onClick={handleGeneratePDF}
              className="bg-green-600 hover:bg-green-700"
            >
              Generate PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CMAReportGenerator;