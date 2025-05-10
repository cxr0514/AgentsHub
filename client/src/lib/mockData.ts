import { Property, MarketData } from "@shared/schema";

// This file is not actually used in the application.
// It's just a reference for the data structure and API responses.

export const sampleProperties: Property[] = [
  {
    id: 1,
    address: "123 Market Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94114",
    neighborhood: "Noe Valley",
    price: "1649000",
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: "2100",
    lotSize: "3200",
    yearBuilt: 1925,
    propertyType: "Single Family",
    status: "Active",
    daysOnMarket: 12,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a"
    ]),
    pricePerSqft: "785",
    description: "Beautiful home in Noe Valley featuring 4 bedrooms and 3 bathrooms.",
    features: JSON.stringify(["Hardwood Floors", "Central Air", "Renovated Kitchen", "Backyard"]),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    address: "456 Valencia Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94103",
    neighborhood: "Mission District",
    price: "1725000",
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: "2250",
    lotSize: "2800",
    yearBuilt: 2012,
    propertyType: "Townhouse",
    status: "Active",
    daysOnMarket: 5,
    images: JSON.stringify([
      "https://images.unsplash.com/photo-1513584684374-8bab748fbf90",
      "https://images.unsplash.com/photo-1600210492493-0946911123ea",
      "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4",
      "https://images.unsplash.com/photo-1600566752355-35792bedcfea"
    ]),
    pricePerSqft: "767",
    description: "Modern townhouse in the vibrant Mission District.",
    features: JSON.stringify(["Smart Home", "High Ceilings", "Quartz Countertops", "Rooftop Deck"]),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const sampleMarketData: MarketData[] = [
  {
    id: 1,
    city: "San Francisco",
    state: "CA",
    zipCode: "94101",
    medianPrice: "1480000",
    averagePricePerSqft: "985",
    daysOnMarket: 30,
    activeListings: 412,
    inventoryMonths: "1.8",
    saleToListRatio: "102",
    priceReductions: "12",
    marketType: "seller",
    month: 9,
    year: 2023,
    createdAt: new Date()
  },
  {
    id: 2,
    city: "San Francisco",
    state: "CA",
    zipCode: "94101",
    medianPrice: "1500000",
    averagePricePerSqft: "1000",
    daysOnMarket: 28,
    activeListings: 425,
    inventoryMonths: "1.7",
    saleToListRatio: "103",
    priceReductions: "10",
    marketType: "seller",
    month: 8,
    year: 2023,
    createdAt: new Date()
  }
];
