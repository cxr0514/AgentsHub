import { pgTable, text, serial, integer, boolean, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  role: text("role").default("user").notNull(),
  mfaEnabled: boolean("mfa_enabled").default(false).notNull(),
  mfaSecret: text("mfa_secret"),
  mfaRecoveryCodes: jsonb("mfa_recovery_codes"), // Array of hashed recovery codes
  phoneNumber: text("phone_number"),
  phoneVerified: boolean("phone_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Properties table
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"), // External ID from MLS/Datafiniti 
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  neighborhood: text("neighborhood"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  price: numeric("price").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: numeric("bathrooms").notNull(),
  squareFeet: numeric("square_feet").notNull(),
  lotSize: numeric("lot_size"),
  yearBuilt: integer("year_built"),
  propertyType: text("property_type").notNull(),
  status: text("status").notNull(), // Active, Pending, Sold
  daysOnMarket: integer("days_on_market"),
  saleDate: timestamp("sale_date"), // For Sold properties
  hasBasement: boolean("has_basement"),
  hasGarage: boolean("has_garage"),
  garageSpaces: integer("garage_spaces"),
  images: jsonb("images"),
  pricePerSqft: numeric("price_per_sqft"),
  description: text("description"),
  features: jsonb("features"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Market data table
export const marketData = pgTable("market_data", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  medianPrice: numeric("median_price"),
  averagePricePerSqft: numeric("average_price_per_sqft"),
  daysOnMarket: integer("days_on_market"),
  activeListings: integer("active_listings"),
  inventoryMonths: numeric("inventory_months"),
  saleToListRatio: numeric("sale_to_list_ratio"),
  priceReductions: numeric("price_reductions"),
  marketType: text("market_type"),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Saved searches table
export const savedSearches = pgTable("saved_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  location: text("location"),
  propertyType: text("property_type"),
  minPrice: numeric("min_price"),
  maxPrice: numeric("max_price"),
  minBeds: integer("min_beds"),
  minBaths: numeric("min_baths"),
  minSqft: numeric("min_sqft"),
  maxSqft: numeric("max_sqft"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Saved properties table
export const savedProperties = pgTable("saved_properties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reports table
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").default("standard").notNull(), // standard, CMA, investment, etc.
  propertyId: integer("property_id").references(() => properties.id), // Subject property ID for CMA reports
  format: text("format").default("pdf"), // pdf, excel, etc.
  properties: jsonb("properties").notNull(), // Store comparison properties, data, settings
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Property history table
export const propertyHistory = pgTable("property_history", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  date: timestamp("date").notNull(),
  price: numeric("price"),
  event: text("event").notNull(), // sold, listed, price change, etc.
  description: text("description"),
});

// AI Market Predictions table
export const marketPredictions = pgTable("market_predictions", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  predictions: jsonb("predictions").notNull(), // Stores AI-generated predictions and analysis
  dataPoints: integer("data_points"), // Number of data points used in analysis
  startDate: timestamp("start_date"), // Beginning of analyzed period
  endDate: timestamp("end_date"), // End of analyzed period
  predictionDate: timestamp("prediction_date").defaultNow().notNull(), // When prediction was generated
  createdAt: timestamp("created_at").defaultNow().notNull(),
  generatedBy: text("generated_by").default("openai").notNull(), // AI model used
});

// Property Recommendations table
export const propertyRecommendations = pgTable("property_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  recommendations: jsonb("recommendations").notNull(), // Stores AI-generated recommendations
  preferences: jsonb("preferences"), // User preferences used for recommendations
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
  role: true,
  mfaEnabled: true,
  mfaSecret: true,
  mfaRecoveryCodes: true,
  phoneNumber: true,
  phoneVerified: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  externalId: z.string().nullable().optional(),
});

export const insertMarketDataSchema = createInsertSchema(marketData).omit({
  id: true,
  createdAt: true,
});

export const insertSavedSearchSchema = createInsertSchema(savedSearches).omit({
  id: true,
  createdAt: true,
});

export const insertSavedPropertySchema = createInsertSchema(savedProperties).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
});

export const insertPropertyHistorySchema = createInsertSchema(propertyHistory).omit({
  id: true,
});

export const insertMarketPredictionsSchema = createInsertSchema(marketPredictions).omit({
  id: true,
  createdAt: true,
  predictionDate: true,
});

export const insertPropertyRecommendationsSchema = createInsertSchema(propertyRecommendations).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

export type InsertMarketData = z.infer<typeof insertMarketDataSchema>;
export type MarketData = typeof marketData.$inferSelect;

export type InsertSavedSearch = z.infer<typeof insertSavedSearchSchema>;
export type SavedSearch = typeof savedSearches.$inferSelect;

export type InsertSavedProperty = z.infer<typeof insertSavedPropertySchema>;
export type SavedProperty = typeof savedProperties.$inferSelect;

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;

export type InsertPropertyHistory = z.infer<typeof insertPropertyHistorySchema>;
export type PropertyHistory = typeof propertyHistory.$inferSelect;

export type InsertMarketPrediction = z.infer<typeof insertMarketPredictionsSchema>;
export type MarketPrediction = typeof marketPredictions.$inferSelect;

export type InsertPropertyRecommendation = z.infer<typeof insertPropertyRecommendationsSchema>;
export type PropertyRecommendation = typeof propertyRecommendations.$inferSelect;
