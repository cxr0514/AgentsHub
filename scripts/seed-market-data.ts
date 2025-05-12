import { db } from "../server/db";
import { marketData } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedMarketData() {
  console.log("Seeding market data...");

  // Delete any existing market data with matching city/state
  await db.delete(marketData)
    .where(
      eq(marketData.city, "Marietta")
    );
  console.log("Cleared existing market data");

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
      inventoryMonths: 3.2,
      saleToListRatio: 0.98,
      priceReductions: 15,
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
      inventoryMonths: 3.5,
      saleToListRatio: 0.97,
      priceReductions: 18,
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
      inventoryMonths: 3.8,
      saleToListRatio: 0.97,
      priceReductions: 20,
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
      inventoryMonths: 4.0,
      saleToListRatio: 0.96,
      priceReductions: 22,
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
      inventoryMonths: 2.8,
      saleToListRatio: 0.99,
      priceReductions: 12,
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
      inventoryMonths: 3.0,
      saleToListRatio: 0.98,
      priceReductions: 14,
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
      inventoryMonths: 3.2,
      saleToListRatio: 0.97,
      priceReductions: 16,
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
      inventoryMonths: 3.4,
      saleToListRatio: 0.97,
      priceReductions: 18,
      marketType: "Seller's Market"
    },
  ];

  // Add createdAt field to each data entry
  const now = new Date();
  const dataWithTimestamp = mariettaData.map(data => ({
    ...data,
    createdAt: now
  }));

  // Insert market data
  await db.insert(marketData).values(dataWithTimestamp);

  console.log(`Seeded ${dataWithTimestamp.length} market data entries`);
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