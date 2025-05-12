import { db } from "../server/db";
import { marketData } from "../shared/schema";

async function seedMarketData() {
  console.log("Seeding market data...");

  // Check if data already exists
  const existingData = await db.select().from(marketData).limit(1);
  if (existingData.length > 0) {
    console.log("Market data already exists, skipping seed");
    return;
  }

  // Sample market data for Marietta, GA
  const mariettaData = [
    {
      city: "Marietta",
      state: "GA",
      zipCode: "30066",
      month: 1,
      year: 2025,
      daysOnMarket: 35,
      medianPrice: "425000",
      averagePricePerSqft: "230",
      activeListings: 145,
      newListings: 42,
      soldListings: 38,
      medianRent: "1950",
      marketType: "Seller's Market"
    },
    {
      city: "Marietta",
      state: "GA",
      zipCode: "30066",
      month: 2,
      year: 2025,
      daysOnMarket: 32,
      medianPrice: "432000",
      averagePricePerSqft: "235",
      activeListings: 152,
      newListings: 48,
      soldListings: 36,
      medianRent: "1975",
      marketType: "Seller's Market"
    },
    {
      city: "Marietta",
      state: "GA",
      zipCode: "30066",
      month: 3,
      year: 2025,
      daysOnMarket: 29,
      medianPrice: "440000",
      averagePricePerSqft: "238",
      activeListings: 160,
      newListings: 56,
      soldListings: 42,
      medianRent: "2000",
      marketType: "Seller's Market"
    },
    {
      city: "Marietta",
      state: "GA",
      zipCode: "30066",
      month: 4,
      year: 2025,
      daysOnMarket: 26,
      medianPrice: "445000",
      averagePricePerSqft: "242",
      activeListings: 172,
      newListings: 58,
      soldListings: 45,
      medianRent: "2025",
      marketType: "Seller's Market"
    },
    // Atlanta data
    {
      city: "Atlanta",
      state: "GA",
      zipCode: "30305",
      month: 1,
      year: 2025,
      daysOnMarket: 28,
      medianPrice: "620000",
      averagePricePerSqft: "305",
      activeListings: 210,
      newListings: 62,
      soldListings: 54,
      medianRent: "2500",
      marketType: "Seller's Market"
    },
    {
      city: "Atlanta",
      state: "GA",
      zipCode: "30305",
      month: 2,
      year: 2025,
      daysOnMarket: 26,
      medianPrice: "630000",
      averagePricePerSqft: "310",
      activeListings: 225,
      newListings: 68,
      soldListings: 58,
      medianRent: "2550",
      marketType: "Seller's Market"
    },
    {
      city: "Atlanta",
      state: "GA",
      zipCode: "30305",
      month: 3,
      year: 2025,
      daysOnMarket: 24,
      medianPrice: "642000",
      averagePricePerSqft: "315",
      activeListings: 238,
      newListings: 72,
      soldListings: 62,
      medianRent: "2600",
      marketType: "Seller's Market"
    },
    {
      city: "Atlanta",
      state: "GA",
      zipCode: "30305",
      month: 4,
      year: 2025,
      daysOnMarket: 22,
      medianPrice: "655000",
      averagePricePerSqft: "320",
      activeListings: 254,
      newListings: 76,
      soldListings: 68,
      medianRent: "2650",
      marketType: "Seller's Market"
    },
  ];

  // Insert market data
  await db.insert(marketData).values(mariettaData);

  console.log(`Seeded ${mariettaData.length} market data entries`);
}

// Execute the seed function
seedMarketData()
  .then(() => {
    console.log("Market data seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error seeding market data:", error);
    process.exit(1);
  });