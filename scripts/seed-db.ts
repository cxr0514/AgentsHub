import { db } from "../server/db";
import { 
  users, properties, marketData, savedSearches, savedProperties, reports, propertyHistory
} from "../shared/schema";

async function seedDatabase() {
  console.log("Starting database seeding...");

  try {
    // Create a sample user
    const [user] = await db.insert(users).values({
      username: "demo",
      password: "password", // In a real application, this would be hashed
      email: "demo@example.com",
      fullName: "Demo User",
      role: "user",
      createdAt: new Date()
    }).returning();
    
    console.log(`Created user with ID: ${user.id}`);

    // Create sample properties
    const propertiesData = [
      {
        address: "123 Market Street",
        city: "San Francisco",
        state: "CA",
        zipCode: "94114",
        neighborhood: "Noe Valley",
        price: "1649000",
        bedrooms: 4,
        bathrooms: "3",
        squareFeet: "2100",
        lotSize: "3200",
        yearBuilt: 1925,
        propertyType: "Single Family",
        status: "Active",
        description: "Beautiful home in Noe Valley featuring 4 bedrooms and 3 bathrooms, completely renovated in 2018.",
        pricePerSqft: "785",
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6",
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
          "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3",
          "https://images.unsplash.com/photo-1616594039964-ae9021a400a0",
          "https://images.unsplash.com/photo-1584622650111-993a426fbf0a",
          "https://images.unsplash.com/photo-1628744448840-55bdb2497bd4"
        ]),
        features: JSON.stringify(["Hardwood Floors", "Central Air", "Renovated Kitchen", "Backyard", "Garage", "Fireplace"]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        address: "456 Valencia Street",
        city: "San Francisco",
        state: "CA",
        zipCode: "94103",
        neighborhood: "Mission District",
        price: "1725000",
        bedrooms: 3,
        bathrooms: "2.5",
        squareFeet: "2250",
        lotSize: "2800",
        yearBuilt: 2012,
        propertyType: "Townhouse",
        status: "Active",
        description: "Modern townhouse in the vibrant Mission District with high-end finishes and spacious rooms.",
        pricePerSqft: "767",
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1513584684374-8bab748fbf90",
          "https://images.unsplash.com/photo-1600210492493-0946911123ea",
          "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4",
          "https://images.unsplash.com/photo-1600566752355-35792bedcfea",
          "https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d"
        ]),
        features: JSON.stringify(["Smart Home", "High Ceilings", "Quartz Countertops", "Rooftop Deck", "Wine Cellar"]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        address: "789 California Avenue",
        city: "San Francisco",
        state: "CA",
        zipCode: "94109",
        neighborhood: "Pacific Heights",
        price: "1595000",
        bedrooms: 3,
        bathrooms: "2",
        squareFeet: "1950",
        lotSize: "0",
        yearBuilt: 2018,
        propertyType: "Condo",
        status: "Pending",
        description: "Luxury condominium in Pacific Heights with stunning city views and high-end amenities.",
        pricePerSqft: "818",
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
          "https://images.unsplash.com/photo-1565183997392-2f6f122e5912",
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
        ]),
        features: JSON.stringify(["Concierge", "Gym", "City Views", "Balcony", "Heated Floors", "Parking"]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        address: "321 Hayes Street",
        city: "San Francisco",
        state: "CA",
        zipCode: "94117",
        neighborhood: "Haight-Ashbury",
        price: "1895000",
        bedrooms: 4,
        bathrooms: "3.5",
        squareFeet: "2400",
        lotSize: "3500",
        yearBuilt: 1908,
        propertyType: "Single Family",
        status: "Sold",
        description: "Historic Victorian home in Haight-Ashbury with original details and modern updates.",
        pricePerSqft: "790",
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf",
          "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde",
          "https://images.unsplash.com/photo-1600607687120-9e4bbebc891c",
          "https://images.unsplash.com/photo-1560440021-33f9b867899d",
          "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf"
        ]),
        features: JSON.stringify(["Victorian Details", "Bay Windows", "Crown Molding", "Updated Kitchen", "Garden"]),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const insertedProperties = await db.insert(properties).values(propertiesData).returning();
    console.log(`Inserted ${insertedProperties.length} properties`);
    
    // Create sample market data
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const medianPrices = [1200000, 1180000, 1250000, 1300000, 1350000, 1400000, 1450000, 1500000, 1480000];
    const daysOnMarket = [35, 34, 33, 32, 31, 30, 29, 28, 30];
    
    for (let i = 0; i < months.length; i++) {
      await db.insert(marketData).values({
        city: "San Francisco",
        state: "CA",
        zipCode: "94101",
        medianPrice: medianPrices[i].toString(),
        averagePricePerSqft: (medianPrices[i] / 1500).toString(),
        daysOnMarket: daysOnMarket[i],
        activeListings: 400 + Math.floor(Math.random() * 50),
        inventoryMonths: "1.8",
        saleToListRatio: "102",
        priceReductions: "12",
        marketType: "seller",
        month: months[i],
        year: 2023,
        createdAt: new Date(`2023-${String(months[i]).padStart(2, '0')}-01`)
      });
    }
    console.log(`Inserted ${months.length} market data records`);
    
    // Create property history for first property
    const historyData = [
      {
        propertyId: 1,
        date: new Date("2018-08-15"),
        price: "1350000",
        event: "sold",
        description: "Previous sale"
      },
      {
        propertyId: 1,
        date: new Date("2010-03-22"),
        price: "920000",
        event: "sold",
        description: "Previous sale"
      },
      {
        propertyId: 1,
        date: new Date("1998-05-10"),
        price: "515000",
        event: "sold",
        description: "Original sale"
      }
    ];
    
    const insertedHistory = await db.insert(propertyHistory).values(historyData).returning();
    console.log(`Inserted ${insertedHistory.length} property history records`);
    
    // Create saved properties for the user
    const savedPropertiesData = [
      {
        userId: user.id,
        propertyId: 1,
        notes: "Great investment opportunity",
        createdAt: new Date()
      },
      {
        userId: user.id,
        propertyId: 2,
        notes: "Perfect for family, love the backyard",
        createdAt: new Date()
      }
    ];
    
    const insertedSavedProperties = await db.insert(savedProperties).values(savedPropertiesData).returning();
    console.log(`Inserted ${insertedSavedProperties.length} saved properties`);
    
    // Create saved searches for the user
    const savedSearchesData = [
      {
        userId: user.id,
        location: "San Francisco",
        propertyType: "Condo",
        minPrice: "1000000",
        maxPrice: "2000000",
        minBeds: 2,
        minBaths: "2",
        minSqft: "1000",
        maxSqft: "2000",
        createdAt: new Date()
      },
      {
        userId: user.id,
        location: "San Francisco",
        propertyType: "Single Family",
        minPrice: "1500000",
        maxPrice: "3000000",
        minBeds: 3,
        minBaths: "2",
        minSqft: "1500",
        maxSqft: "4000",
        createdAt: new Date()
      }
    ];
    
    const insertedSavedSearches = await db.insert(savedSearches).values(savedSearchesData).returning();
    console.log(`Inserted ${insertedSavedSearches.length} saved searches`);
    
    // Create reports for the user
    const reportsData = [
      {
        userId: user.id,
        title: "San Francisco Properties Comparison",
        description: "Analysis of properties in Financial District",
        properties: JSON.stringify([1, 3]),
        createdAt: new Date()
      },
      {
        userId: user.id,
        title: "Victorian Homes Research",
        description: "Comparing Victorian properties in various neighborhoods",
        properties: JSON.stringify([2, 4]),
        createdAt: new Date()
      }
    ];
    
    const insertedReports = await db.insert(reports).values(reportsData).returning();
    console.log(`Inserted ${insertedReports.length} reports`);
    
    console.log("Database seeding completed successfully!");
    
  } catch (error) {
    console.error("Error seeding database:", error);
  }
  
  process.exit(0);
}

seedDatabase();