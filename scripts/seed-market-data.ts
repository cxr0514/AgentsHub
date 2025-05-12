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
      zip_code: "30066",
      month: 2,
      year: 2025,
      days_on_market: 32,
      median_price: "432000",
      average_price_per_sqft: "235",
      active_listings: 152,
      inventory_months: 3.5,
      sale_to_list_ratio: 0.97,
      price_reductions: 18,
      market_type: "Seller's Market"
    },
    {
      city: "Marietta",
      state: "GA",
      zip_code: "30066",
      month: 3,
      year: 2025,
      days_on_market: 29,
      median_price: "440000",
      average_price_per_sqft: "238",
      active_listings: 160,
      inventory_months: 3.8,
      sale_to_list_ratio: 0.97,
      price_reductions: 20,
      market_type: "Seller's Market"
    },
    {
      city: "Marietta",
      state: "GA",
      zip_code: "30066",
      month: 4,
      year: 2025,
      days_on_market: 26,
      median_price: "445000",
      average_price_per_sqft: "242",
      active_listings: 172,
      inventory_months: 4.0,
      sale_to_list_ratio: 0.96,
      price_reductions: 22,
      market_type: "Seller's Market"
    },
    // Atlanta data
    {
      city: "Atlanta",
      state: "GA",
      zip_code: "30305",
      month: 1,
      year: 2025,
      days_on_market: 28,
      median_price: "620000",
      average_price_per_sqft: "305",
      active_listings: 210,
      inventory_months: 2.8,
      sale_to_list_ratio: 0.99,
      price_reductions: 12,
      market_type: "Seller's Market"
    },
    {
      city: "Atlanta",
      state: "GA",
      zip_code: "30305",
      month: 2,
      year: 2025,
      days_on_market: 26,
      median_price: "630000",
      average_price_per_sqft: "310",
      active_listings: 225,
      inventory_months: 3.0,
      sale_to_list_ratio: 0.98,
      price_reductions: 14,
      market_type: "Seller's Market"
    },
    {
      city: "Atlanta",
      state: "GA",
      zip_code: "30305",
      month: 3,
      year: 2025,
      days_on_market: 24,
      median_price: "642000",
      average_price_per_sqft: "315",
      active_listings: 238,
      inventory_months: 3.2,
      sale_to_list_ratio: 0.97,
      price_reductions: 16,
      market_type: "Seller's Market"
    },
    {
      city: "Atlanta",
      state: "GA",
      zip_code: "30305",
      month: 4,
      year: 2025,
      days_on_market: 22,
      median_price: "655000",
      average_price_per_sqft: "320",
      active_listings: 254,
      inventory_months: 3.4,
      sale_to_list_ratio: 0.97,
      price_reductions: 18,
      market_type: "Seller's Market"
    },
  ];

  // Add created_at field to each data entry
  const now = new Date();
  const dataWithTimestamp = mariettaData.map(data => ({
    ...data,
    created_at: now
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