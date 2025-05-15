// This file exports our mock data for use throughout the application
// Later, these would be replaced with actual API calls

export const markets = {
  location: "Atlanta, GA",
  currentTrends: {
    avgDaysOnMarket: 18,
    totalListings: 3254,
    priceChangeYOY: 7.8,
    inventoryYOY: 4.2,
    priceHistory: [
      { date: "Jan 2024", price: 385000 },
      { date: "Feb 2024", price: 392000 },
      { date: "Mar 2024", price: 398000 },
      { date: "Apr 2024", price: 405000 },
      { date: "May 2024", price: 412000 },
      { date: "Jun 2024", price: 420000 },
      { date: "Jul 2024", price: 425000 },
      { date: "Aug 2024", price: 430000 },
      { date: "Sep 2024", price: 432000 },
      { date: "Oct 2024", price: 435000 },
      { date: "Nov 2024", price: 438000 },
      { date: "Dec 2024", price: 442000 },
      { date: "Jan 2025", price: 448000 },
      { date: "Feb 2025", price: 455000 },
      { date: "Mar 2025", price: 462000 },
      { date: "Apr 2025", price: 469000 },
      { date: "May 2025", price: 475000 }
    ]
  },
  neighborhoodBreakdown: [
    { name: "Midtown", priceChangeYOY: 9.2, avgPrice: 545000 },
    { name: "Buckhead", priceChangeYOY: 8.5, avgPrice: 695000 },
    { name: "Inman Park", priceChangeYOY: 7.8, avgPrice: 625000 },
    { name: "Virginia Highland", priceChangeYOY: 7.2, avgPrice: 575000 },
    { name: "Grant Park", priceChangeYOY: 6.9, avgPrice: 518000 },
    { name: "Old Fourth Ward", priceChangeYOY: 8.3, avgPrice: 498000 },
    { name: "Decatur", priceChangeYOY: 6.5, avgPrice: 485000 }
  ],
  propertyTypeBreakdown: [
    { type: "Single Family", avgPrice: 485000, inventory: 1850, priceChangeYOY: 7.8 },
    { type: "Condo", avgPrice: 350000, inventory: 920, priceChangeYOY: 5.2 },
    { type: "Townhouse", avgPrice: 395000, inventory: 484, priceChangeYOY: 6.4 }
  ],
  rentalMarketOverview: {
    avgRent: 1895,
    rentChangeYOY: 5.2,
    occupancyRate: 95.8,
    priceToRentRatio: 18.7
  }
};

export const properties = [
  {
    id: 1,
    address: "123 Main St",
    city: "Atlanta",
    state: "GA",
    price: 450000,
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1800,
    year_built: 2010,
    images: ["https://placehold.co/600x400?text=Property+1"]
  },
  {
    id: 2,
    address: "456 Oak Ave",
    city: "Atlanta",
    state: "GA",
    price: 525000,
    bedrooms: 4,
    bathrooms: 2.5,
    square_feet: 2200,
    year_built: 2005,
    images: ["https://placehold.co/600x400?text=Property+2"]
  },
  {
    id: 3,
    address: "789 Pine Rd",
    city: "Atlanta",
    state: "GA",
    price: 385000,
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1650,
    year_built: 1998,
    images: ["https://placehold.co/600x400?text=Property+3"]
  }
];

export const comparables = [
  {
    id: 101,
    subjectPropertyId: 1,
    address: "125 Main St",
    city: "Atlanta",
    state: "GA",
    price: 445000,
    saleDate: "2025-02-15",
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1750,
    year_built: 2008,
    distance_miles: 0.2,
    adjusted_price: 447000,
    adjustments: [
      {factor: "Square Footage", amount: 2000},
      {factor: "Year Built", amount: 500},
      {factor: "Date of Sale", amount: -500}
    ],
    image: "https://placehold.co/600x400?text=Comp+1"
  },
  {
    id: 102,
    subjectPropertyId: 1,
    address: "130 Park Ave",
    city: "Atlanta",
    state: "GA",
    price: 465000,
    saleDate: "2025-03-05",
    bedrooms: 3,
    bathrooms: 2,
    square_feet: 1900,
    year_built: 2012,
    distance_miles: 0.3,
    adjusted_price: 455000,
    adjustments: [
      {factor: "Square Footage", amount: -5000},
      {factor: "Year Built", amount: -1000},
      {factor: "Date of Sale", amount: -4000}
    ],
    image: "https://placehold.co/600x400?text=Comp+2"
  },
  {
    id: 103,
    subjectPropertyId: 1,
    address: "145 Elm St",
    city: "Atlanta",
    state: "GA",
    price: 435000,
    saleDate: "2025-01-20",
    bedrooms: 3,
    bathrooms: 1.5,
    square_feet: 1720,
    year_built: 2007,
    distance_miles: 0.5,
    adjusted_price: 445000,
    adjustments: [
      {factor: "Square Footage", amount: 4000},
      {factor: "Bathrooms", amount: 10000},
      {factor: "Year Built", amount: 1500},
      {factor: "Date of Sale", amount: -5500}
    ],
    image: "https://placehold.co/600x400?text=Comp+3"
  }
];

export const rentalProperties = [
  {
    id: 201,
    address: "555 Peachtree St",
    city: "Atlanta",
    state: "GA",
    zipCode: "30308",
    rentPrice: 2100,
    bedrooms: 2,
    bathrooms: 2,
    square_feet: 1200,
    propertyType: "Apartment",
    images: ["https://placehold.co/600x400?text=Rental+1"]
  },
  {
    id: 202,
    address: "789 Juniper St",
    city: "Atlanta",
    state: "GA",
    zipCode: "30309",
    rentPrice: 1850,
    bedrooms: 1,
    bathrooms: 1,
    square_feet: 850,
    propertyType: "Condo",
    images: ["https://placehold.co/600x400?text=Rental+2"]
  },
  {
    id: 203,
    address: "1010 Piedmont Ave",
    city: "Atlanta",
    state: "GA",
    zipCode: "30309",
    rentPrice: 2800,
    bedrooms: 3,
    bathrooms: 2.5,
    square_feet: 1800,
    propertyType: "Townhouse",
    images: ["https://placehold.co/600x400?text=Rental+3"]
  }
];