import { relations, sql } from "drizzle-orm";
import { 
  integer, 
  serial, 
  text, 
  timestamp, 
  boolean, 
  pgTable, 
  doublePrecision, 
  json, 
  primaryKey,
  text as pgText
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Properties
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  neighborhood: text("neighborhood"),
  price: text("price").notNull(),
  bedrooms: integer("bedrooms").notNull(),
  bathrooms: text("bathrooms").notNull(),
  squareFeet: text("square_feet").notNull(),
  lotSize: text("lot_size"),
  yearBuilt: integer("year_built"),
  propertyType: text("property_type").notNull(),
  status: text("status").notNull().default("active"),
  daysOnMarket: integer("days_on_market"),
  images: json("images").$type<string[]>(),
  mainImageUrl: text("main_image_url"),
  pricePerSqft: text("price_per_sqft"),
  description: text("description"),
  features: json("features").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  saleDate: timestamp("sale_date"),
  hasBasement: boolean("has_basement").default(false),
  hasGarage: boolean("has_garage").default(false),
  garageSpaces: integer("garage_spaces"),
  externalId: text("external_id"),
});

// Property Relations
export const propertiesRelations = relations(properties, ({ many }) => ({
  savedProperties: many(savedProperties),
  reports: many(reports),
  propertyHistory: many(propertyHistory),
  sharedProperties: many(sharedProperties),
}));

// Market Data
export const marketData = pgTable("market_data", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  medianPrice: text("median_price").notNull(),
  averagePricePerSqft: doublePrecision("average_price_per_sqft"),
  daysOnMarket: integer("days_on_market"),
  activeListings: integer("active_listings"),
  inventoryMonths: doublePrecision("inventory_months"),
  saleToListRatio: doublePrecision("sale_to_list_ratio"),
  priceReductions: doublePrecision("price_reductions"),
  marketType: text("market_type"),
  month: integer("month"),
  year: integer("year"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved Searches
export const savedSearches = pgTable("saved_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  filters: json("filters").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved Properties
export const savedProperties = pgTable("saved_properties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: 'cascade' }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved Properties Relations
export const savedPropertiesRelations = relations(savedProperties, ({ one }) => ({
  user: one(users, {
    fields: [savedProperties.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [savedProperties.propertyId],
    references: [properties.id],
  }),
}));

// Reports
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  type: text("type").notNull(), // CMA, Investment Analysis, etc.
  properties: json("properties").notNull(),
  propertyId: integer("property_id").references(() => properties.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reports Relations
export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [reports.propertyId],
    references: [properties.id],
  }),
}));

// Property History
export const propertyHistory = pgTable("property_history", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: 'cascade' }),
  date: timestamp("date").notNull(),
  event: text("event").notNull(), // Listed, Price Changed, Sold, etc.
  price: text("price"),
  description: text("description"),
});

// Property History Relations
export const propertyHistoryRelations = relations(propertyHistory, ({ one }) => ({
  property: one(properties, {
    fields: [propertyHistory.propertyId],
    references: [properties.id],
  }),
}));

// Market Predictions (AI generated)
export const marketPredictions = pgTable("market_predictions", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  predictedMedianPrice: text("predicted_median_price").notNull(),
  predictedYoyChange: doublePrecision("predicted_yoy_change").notNull(),
  confidenceScore: doublePrecision("confidence_score").notNull(),
  timeframe: text("timeframe").notNull(), // "3 months", "6 months", "1 year"
  factors: json("factors").notNull(), // Factors influencing the prediction
  predictionDate: timestamp("prediction_date").defaultNow(), // When the prediction was made
  createdAt: timestamp("created_at").defaultNow(),
});

// Property Recommendations (AI generated)
export const propertyRecommendations = pgTable("property_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: 'cascade' }),
  score: doublePrecision("score").notNull(),
  reasonForRecommendation: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Property Recommendations Relations
export const propertyRecommendationsRelations = relations(propertyRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [propertyRecommendations.userId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [propertyRecommendations.propertyId],
    references: [properties.id],
  }),
}));

// New: Collaboration - Shared Properties
export const sharedProperties = pgTable("shared_properties", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: 'cascade' }),
  sharedWith: text("shared_with").notNull(), // Email address to share with
  accessToken: text("access_token").notNull(), // Unique token for secure access
  notes: text("notes"), // Owner's notes about the property
  hasAccessed: boolean("has_accessed").default(false), // Whether the recipient has accessed the shared property
  expiresAt: timestamp("expires_at"), // Optional expiration date
  allowComments: boolean("allow_comments").default(true), // Whether recipients can add comments
  createdAt: timestamp("created_at").defaultNow(),
});

// Shared Properties Relations
export const sharedPropertiesRelations = relations(sharedProperties, ({ one }) => ({
  owner: one(users, {
    fields: [sharedProperties.ownerId],
    references: [users.id],
  }),
  property: one(properties, {
    fields: [sharedProperties.propertyId],
    references: [properties.id],
  }),
}));

// New: Collaboration - Property Comments
export const propertyComments = pgTable("property_comments", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: 'cascade' }),
  userId: integer("user_id").references(() => users.id, { onDelete: 'set null' }), // Can be null for comments from non-users via shared links
  sharedPropertyId: integer("shared_property_id").references(() => sharedProperties.id, { onDelete: 'cascade' }),
  comment: text("comment").notNull(),
  commenterName: text("commenter_name"), // For non-users who access via shared link
  commenterEmail: text("commenter_email"), // For non-users who access via shared link
  createdAt: timestamp("created_at").defaultNow(),
});

// Property Comments Relations
export const propertyCommentsRelations = relations(propertyComments, ({ one }) => ({
  property: one(properties, {
    fields: [propertyComments.propertyId],
    references: [properties.id],
  }),
  user: one(users, {
    fields: [propertyComments.userId],
    references: [users.id],
  }),
  sharedProperty: one(sharedProperties, {
    fields: [propertyComments.sharedPropertyId],
    references: [sharedProperties.id],
  }),
}));

// New: Collaboration - Shared Reports
export const sharedReports = pgTable("shared_reports", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => reports.id, { onDelete: 'cascade' }),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sharedWith: text("shared_with").notNull(), // Email address to share with
  accessToken: text("access_token").notNull(), // Unique token for secure access
  hasAccessed: boolean("has_accessed").default(false),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shared Reports Relations
export const sharedReportsRelations = relations(sharedReports, ({ one }) => ({
  report: one(reports, {
    fields: [sharedReports.reportId],
    references: [reports.id],
  }),
  owner: one(users, {
    fields: [sharedReports.ownerId],
    references: [users.id],
  }),
}));

// New: Collaboration Teams
export const collaborationTeams = pgTable("collaboration_teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: integer("owner_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Team Members Junction Table
export const teamMembers = pgTable("team_members", {
  teamId: integer("team_id").notNull().references(() => collaborationTeams.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text("role").default("member"), // "owner", "admin", "member"
  joinedAt: timestamp("joined_at").defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.teamId, t.userId] }),
}));

// Team Properties Junction Table
export const teamProperties = pgTable("team_properties", {
  teamId: integer("team_id").notNull().references(() => collaborationTeams.id, { onDelete: 'cascade' }),
  propertyId: integer("property_id").notNull().references(() => properties.id, { onDelete: 'cascade' }),
  addedById: integer("added_by_id").notNull().references(() => users.id, { onDelete: 'set null' }),
  addedAt: timestamp("added_at").defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.teamId, t.propertyId] }),
}));

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export const insertUserSchema = createInsertSchema(users);

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;
export const insertPropertySchema = createInsertSchema(properties);

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = typeof marketData.$inferInsert;
export const insertMarketDataSchema = createInsertSchema(marketData);

export type SavedSearch = typeof savedSearches.$inferSelect;
export type InsertSavedSearch = typeof savedSearches.$inferInsert;
export const insertSavedSearchSchema = createInsertSchema(savedSearches);

export type SavedProperty = typeof savedProperties.$inferSelect;
export type InsertSavedProperty = typeof savedProperties.$inferInsert;
export const insertSavedPropertySchema = createInsertSchema(savedProperties);

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
export const insertReportSchema = createInsertSchema(reports);

export type PropertyHistory = typeof propertyHistory.$inferSelect;
export type InsertPropertyHistory = typeof propertyHistory.$inferInsert;
export const insertPropertyHistorySchema = createInsertSchema(propertyHistory);

export type MarketPrediction = typeof marketPredictions.$inferSelect;
export type InsertMarketPrediction = typeof marketPredictions.$inferInsert;
export const insertMarketPredictionSchema = createInsertSchema(marketPredictions);

export type PropertyRecommendation = typeof propertyRecommendations.$inferSelect;
export type InsertPropertyRecommendation = typeof propertyRecommendations.$inferInsert;
export const insertPropertyRecommendationSchema = createInsertSchema(propertyRecommendations);

// New collaboration type definitions
export type SharedProperty = typeof sharedProperties.$inferSelect;
export type InsertSharedProperty = typeof sharedProperties.$inferInsert;
export const insertSharedPropertySchema = createInsertSchema(sharedProperties);

export type PropertyComment = typeof propertyComments.$inferSelect;
export type InsertPropertyComment = typeof propertyComments.$inferInsert;
export const insertPropertyCommentSchema = createInsertSchema(propertyComments);

export type SharedReport = typeof sharedReports.$inferSelect;
export type InsertSharedReport = typeof sharedReports.$inferInsert;
export const insertSharedReportSchema = createInsertSchema(sharedReports);

export type CollaborationTeam = typeof collaborationTeams.$inferSelect;
export type InsertCollaborationTeam = typeof collaborationTeams.$inferInsert;
export const insertCollaborationTeamSchema = createInsertSchema(collaborationTeams);

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;
export const insertTeamMemberSchema = createInsertSchema(teamMembers);

export type TeamProperty = typeof teamProperties.$inferSelect;
export type InsertTeamProperty = typeof teamProperties.$inferInsert;
export const insertTeamPropertySchema = createInsertSchema(teamProperties);

// Rental Properties
export const rentalProperties = pgTable("rental_properties", {
  id: serial("id").primaryKey(),
  externalId: text("external_id"),
  address: text("address").notNull(),
  addressStreet: text("address_street"),
  addressCity: text("address_city").notNull(),
  addressState: text("address_state").notNull(),
  addressZipcode: integer("address_zipcode"),
  buildingName: text("building_name"),
  statusType: text("status_type").notNull(),
  statusText: text("status_text"),
  propertyType: text("property_type").default("apartment"),
  isBuilding: boolean("is_building").default(false),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  mainImageUrl: text("main_image_url"),
  detailUrl: text("detail_url"),
  availabilityCount: integer("availability_count"),
  description: text("description"),
  amenities: json("amenities").$type<string[]>(),
  images: json("images").$type<{url: string}[]>(),
  units: json("units").$type<{price: string, beds: string, baths?: string, roomForRent: boolean}[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  source: text("source").default("zillow"),
  rawData: json("raw_data"),
});

// Rental Properties Relations
export const rentalPropertiesRelations = relations(rentalProperties, ({ many }) => ({
  savedRentalProperties: many(savedRentalProperties),
}));

// Saved Rental Properties
export const savedRentalProperties = pgTable("saved_rental_properties", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  rentalPropertyId: integer("rental_property_id").notNull().references(() => rentalProperties.id, { onDelete: 'cascade' }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Saved Rental Properties Relations
export const savedRentalPropertiesRelations = relations(savedRentalProperties, ({ one }) => ({
  user: one(users, {
    fields: [savedRentalProperties.userId],
    references: [users.id],
  }),
  rentalProperty: one(rentalProperties, {
    fields: [savedRentalProperties.rentalPropertyId],
    references: [rentalProperties.id],
  }),
}));

export type RentalProperty = typeof rentalProperties.$inferSelect;
export type InsertRentalProperty = typeof rentalProperties.$inferInsert;
export const insertRentalPropertySchema = createInsertSchema(rentalProperties);

export type SavedRentalProperty = typeof savedRentalProperties.$inferSelect;
export type InsertSavedRentalProperty = typeof savedRentalProperties.$inferInsert;
export const insertSavedRentalPropertySchema = createInsertSchema(savedRentalProperties);