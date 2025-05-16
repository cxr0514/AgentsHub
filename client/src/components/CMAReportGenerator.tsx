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
    
    // Define a safe default position for the text
    const finalY = 150; // Default position if tableResult doesn't provide one
    
    doc.setFontSize(14);
    doc.text('Estimated Market Value', 14, finalY + 20);
    
    doc.setFontSize(12);
    doc.text(`$${Math.round(avgAdjPrice).toLocaleString()}`, 14, finalY + 30);
    
    // Save the PDF
    doc.save('CMA_Report.pdf');
  };

  return (
    <div className="container mx-auto">
      {/* Step indicators */}
      <div className="flex mb-8 rounded-md overflow-hidden border border-[#0f1d31]">
        <div className={`flex-1 text-center p-2 ${step === 1 ? 'bg-[#FF7A00] text-white' : 'bg-[#0f1d31] text-gray-300'}`}>
          Step 1: Select Subject Property
        </div>
        <div className={`flex-1 text-center p-2 ${step === 2 ? 'bg-[#FF7A00] text-white' : 'bg-[#0f1d31] text-gray-300'}`}>
          Step 2: Select Comparables
        </div>
        <div className={`flex-1 text-center p-2 ${step === 3 ? 'bg-[#FF7A00] text-white' : 'bg-[#0f1d31] text-gray-300'}`}>
          Step 3: Adjust Comparables
        </div>
        <div className={`flex-1 text-center p-2 ${step === 4 ? 'bg-[#FF7A00] text-white' : 'bg-[#0f1d31] text-gray-300'}`}>
          Step 4: Preview & Download
        </div>
      </div>
      
      {/* Step 1: Select Subject Property */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">Select Subject Property</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableProperties.map((property) => (
              <Card 
                key={property.id} 
                className={`cursor-pointer bg-[#071224] border-[#0f1d31] hover:border-[#FF7A00] transition-all ${selectedProperty?.id === property.id ? 'border-2 border-[#FF7A00]' : ''}`}
                onClick={() => handleSelectProperty(property)}
              >
                <CardContent className="p-4">
                  <div className="font-semibold text-white">{property.address}</div>
                  <div className="text-gray-300">{property.city}, {property.state}</div>
                  <div className="text-lg font-bold text-white">${property.price.toLocaleString()}</div>
                  <div className="text-gray-300">{property.bedrooms} beds, {property.bathrooms} baths</div>
                  <div className="text-gray-300">{property.square_feet} sq ft</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Step 2: Select Comparables */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">Select Comparable Properties</h2>
          {availableComps.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {availableComps.map((comp) => (
                  <Card 
                    key={comp.id} 
                    className={`cursor-pointer bg-[#071224] border-[#0f1d31] hover:border-[#FF7A00] transition-all ${selectedComps.find(c => c.id === comp.id) ? 'border-2 border-[#FF7A00]' : ''}`}
                    onClick={() => handleSelectComp(comp)}
                  >
                    <CardContent className="p-4">
                      <div className="font-semibold text-white">{comp.address}</div>
                      <div className="text-gray-300">{comp.city}, {comp.state}</div>
                      <div className="text-lg font-bold text-white">${comp.price.toLocaleString()}</div>
                      <div className="text-gray-300">{comp.bedrooms} beds, {comp.bathrooms} baths</div>
                      <div className="text-gray-300">{comp.square_feet} sq ft</div>
                      <div className="text-gray-300">Distance: {comp.distance_miles.toFixed(2)} mi</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex justify-between">
                <Button onClick={() => setStep(1)} variant="outline" className="border-[#0f1d31] text-white hover:bg-[#0f1d31]">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  disabled={selectedComps.length === 0}
                  className="bg-[#FF7A00] hover:bg-[#e56e00] text-white"
                >
                  Continue
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="mb-4 text-gray-300">No comparable properties found for this subject property.</p>
              <Button onClick={() => setStep(1)} variant="outline" className="border-[#0f1d31] text-white hover:bg-[#0f1d31]">
                Back to Property Selection
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Step 3: Adjust Comparables */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">Adjust Comparables</h2>
          <div className="overflow-x-auto rounded-md border border-[#0f1d31]">
            <table className="min-w-full">
              <thead className="bg-[#0f1d31]">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-[#1a2942]">Address</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-[#1a2942]">Sale Price</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-[#1a2942]">Adjustments</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-[#1a2942]">Adjusted Price</th>
                </tr>
              </thead>
              <tbody className="bg-[#071224] divide-y divide-[#1a2942]">
                {selectedComps.map((comp) => (
                  <tr key={comp.id}>
                    <td className="py-3 px-4 text-gray-200">{comp.address}</td>
                    <td className="py-3 px-4 text-gray-200">${comp.price.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      {comp.adjustments.map((adj, index) => (
                        <div key={index} className="text-gray-200">
                          {adj.factor}: <span className={adj.amount > 0 ? 'text-green-400' : 'text-red-400'}>${Math.abs(adj.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3 px-4 text-gray-200">${comp.adjusted_price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between mt-6">
            <Button onClick={() => setStep(2)} variant="outline" className="border-[#0f1d31] text-white hover:bg-[#0f1d31]">
              Back
            </Button>
            <Button 
              onClick={() => setStep(4)} 
              className="bg-[#FF7A00] hover:bg-[#e56e00] text-white"
            >
              Continue
            </Button>
          </div>
        </div>
      )}
      
      {/* Step 4: Preview & Download */}
      {step === 4 && selectedProperty && (
        <div>
          <h2 className="text-xl font-semibold mb-4 text-white">Preview & Download</h2>
          <div className="bg-[#071224] p-6 border border-[#0f1d31] rounded-lg mb-6">
            <h3 className="text-xl font-bold mb-4 text-white">Comparative Market Analysis (CMA) Report</h3>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2 text-white">Subject Property</h4>
              <p className="mb-1 text-gray-300">{selectedProperty.address}, {selectedProperty.city}, {selectedProperty.state}</p>
              <p className="mb-1 text-gray-300">Price: <span className="text-white">${selectedProperty.price.toLocaleString()}</span></p>
              <p className="mb-1 text-gray-300">Bedrooms: <span className="text-white">{selectedProperty.bedrooms}</span></p>
              <p className="mb-1 text-gray-300">Bathrooms: <span className="text-white">{selectedProperty.bathrooms}</span></p>
              <p className="mb-1 text-gray-300">Square Feet: <span className="text-white">{selectedProperty.square_feet}</span></p>
            </div>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2 text-white">Comparable Properties</h4>
              <div className="overflow-x-auto rounded-md border border-[#0f1d31]">
                <table className="min-w-full">
                  <thead className="bg-[#0f1d31]">
                    <tr>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-[#1a2942]">Address</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-[#1a2942]">Sale Price</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-[#1a2942]">Adjusted Price</th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-[#1a2942]">Distance (mi)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#071224] divide-y divide-[#1a2942]">
                    {selectedComps.map((comp) => (
                      <tr key={comp.id}>
                        <td className="py-3 px-4 text-gray-200">{comp.address}</td>
                        <td className="py-3 px-4 text-gray-200">${comp.price.toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-200">${comp.adjusted_price.toLocaleString()}</td>
                        <td className="py-3 px-4 text-gray-200">{comp.distance_miles.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-2 text-white">Estimated Market Value</h4>
              <p className="text-xl font-bold text-[#FF7A00]">
                ${Math.round(selectedComps.reduce((sum, comp) => sum + comp.adjusted_price, 0) / selectedComps.length).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button onClick={() => setStep(3)} variant="outline" className="border-[#0f1d31] text-white hover:bg-[#0f1d31]">
              Back
            </Button>
            <Button 
              onClick={handleGeneratePDF}
              className="bg-[#FF7A00] hover:bg-[#e56e00] text-white"
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