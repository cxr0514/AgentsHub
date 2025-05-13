import {
  users, properties, marketData, savedSearches, savedProperties, reports, propertyHistory,
  marketPredictions, propertyRecommendations, sharedProperties, propertyComments, collaborationTeams,
  teamMembers, teamProperties,
  type User, type Property, type MarketData, type SavedSearch, type SavedProperty, type Report, type PropertyHistory,
  type MarketPrediction, type PropertyRecommendation, type SharedProperty, type PropertyComment,
  type CollaborationTeam, type TeamMember, type TeamProperty,
  type InsertUser, type InsertProperty, type InsertMarketData, type InsertSavedSearch, type InsertSavedProperty, 
  type InsertReport, type InsertPropertyHistory, type InsertMarketPrediction, type InsertPropertyRecommendation,
  type InsertSharedProperty, type InsertPropertyComment, type InsertCollaborationTeam, type InsertTeamMember,
  type InsertTeamProperty
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, gte, lte, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;

  // Property methods
  getProperty(id: number): Promise<Property | undefined>;
  getAllProperties(): Promise<Property[]>;
  getPropertiesByFilters(filters: PropertyFilters): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;

  // Market data methods
  getMarketData(id: number): Promise<MarketData | undefined>;
  getMarketDataByLocation(city: string, state: string, zipCode?: string): Promise<MarketData[]>;
  createMarketData(data: InsertMarketData): Promise<MarketData>;

  // Saved searches methods
  getSavedSearchesByUser(userId: number): Promise<SavedSearch[]>;
  createSavedSearch(search: InsertSavedSearch): Promise<SavedSearch>;
  deleteSavedSearch(id: number): Promise<boolean>;

  // Saved properties methods
  getSavedPropertiesByUser(userId: number): Promise<SavedProperty[]>;
  createSavedProperty(saved: InsertSavedProperty): Promise<SavedProperty>;
  deleteSavedProperty(id: number): Promise<boolean>;

  // Reports methods
  getReport(id: number): Promise<Report | undefined>;
  getReportsByUser(userId: number): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;
  deleteReport(id: number): Promise<boolean>;

  // Property history methods
  getPropertyHistory(propertyId: number): Promise<PropertyHistory[]>;
  createPropertyHistory(history: InsertPropertyHistory): Promise<PropertyHistory>;
  
  // AI prediction methods
  getMarketPrediction(id: number): Promise<MarketPrediction | undefined>;
  getMarketPredictionsByLocation(city: string, state: string, zipCode?: string): Promise<MarketPrediction[]>;
  createMarketPrediction(prediction: InsertMarketPrediction): Promise<MarketPrediction>;
  
  // Property recommendation methods
  getPropertyRecommendation(id: number): Promise<PropertyRecommendation | undefined>;
  getPropertyRecommendationsByUser(userId: number): Promise<PropertyRecommendation[]>;
  createPropertyRecommendation(recommendation: InsertPropertyRecommendation): Promise<PropertyRecommendation>;
  
  // Collaboration - Shared Properties methods
  getSharedProperty(id: number): Promise<SharedProperty | undefined>;
  getSharedPropertyByToken(token: string): Promise<SharedProperty | undefined>;
  getSharedPropertiesByOwner(ownerId: number): Promise<SharedProperty[]>;
  getSharedPropertiesByEmail(email: string): Promise<SharedProperty[]>; 
  createSharedProperty(property: InsertSharedProperty): Promise<SharedProperty>;
  updateSharedProperty(id: number, updates: Partial<SharedProperty>): Promise<SharedProperty | undefined>;
  deleteSharedProperty(id: number): Promise<boolean>;
  
  // Collaboration - Property Comments methods
  getPropertyComment(id: number): Promise<PropertyComment | undefined>;
  getPropertyCommentsByProperty(propertyId: number): Promise<PropertyComment[]>;
  getPropertyCommentsBySharedProperty(sharedPropertyId: number): Promise<PropertyComment[]>;
  createPropertyComment(comment: InsertPropertyComment): Promise<PropertyComment>;
  deletePropertyComment(id: number): Promise<boolean>;
  
  // Collaboration - Teams methods
  getCollaborationTeam(id: number): Promise<CollaborationTeam | undefined>;
  getTeamsByUserId(userId: number): Promise<CollaborationTeam[]>;
  createCollaborationTeam(team: InsertCollaborationTeam): Promise<CollaborationTeam>;
  updateCollaborationTeam(id: number, updates: Partial<CollaborationTeam>): Promise<CollaborationTeam | undefined>;
  deleteCollaborationTeam(id: number): Promise<boolean>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: number): Promise<boolean>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  addPropertyToTeam(teamProperty: InsertTeamProperty): Promise<TeamProperty>;
  removePropertyFromTeam(teamId: number, propertyId: number): Promise<boolean>;
  getTeamProperties(teamId: number): Promise<Property[]>;
}

export interface PropertyFilters {
  location?: string;
  state?: string; // State code (e.g., GA, FL, CA)
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  maxBeds?: number; // For bed range (±1)
  minBaths?: number;
  maxBaths?: number; // For bath range (±1)
  minSqft?: number;
  maxSqft?: number;
  status?: string; // Active, Pending, Sold
  statusList?: string[]; // Multiple statuses
  yearBuilt?: number | string; // Can be a number or special string like 'any_year'
  zipCode?: string;
  radius?: number; // Miles radius for location search
  lat?: number; // Latitude for radius search
  lng?: number; // Longitude for radius search
  hasBasement?: boolean;
  hasGarage?: boolean;
  minGarageSpaces?: number;
  saleDate?: Date; // For filtering sold comps by date
  saleDateStart?: string; // For sale date range
  saleDateEnd?: string; // For sale date range
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private marketData: Map<number, MarketData>;
  private savedSearches: Map<number, SavedSearch>;
  private savedProperties: Map<number, SavedProperty>;
  private reports: Map<number, Report>;
  private propertyHistory: Map<number, PropertyHistory>;
  private marketPredictions: Map<number, MarketPrediction>;
  private propertyRecommendations: Map<number, PropertyRecommendation>;
  
  // New collaboration maps
  private sharedProperties: Map<number, SharedProperty>;
  private propertyComments: Map<number, PropertyComment>;
  private collaborationTeams: Map<number, CollaborationTeam>;
  private teamMembers: Map<string, TeamMember>; // key is teamId-userId
  private teamProperties: Map<string, TeamProperty>; // key is teamId-propertyId

  private userId: number;
  private propertyId: number;
  private marketDataId: number;
  private savedSearchId: number;
  private savedPropertyId: number;
  private reportId: number;
  private propertyHistoryId: number;
  private marketPredictionId: number;
  private propertyRecommendationId: number;
  private sharedPropertyId: number;
  private propertyCommentId: number;
  private collaborationTeamId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.marketData = new Map();
    this.savedSearches = new Map();
    this.savedProperties = new Map();
    this.reports = new Map();
    this.propertyHistory = new Map();
    this.marketPredictions = new Map();
    this.propertyRecommendations = new Map();
    
    // Initialize collaboration maps
    this.sharedProperties = new Map();
    this.propertyComments = new Map();
    this.collaborationTeams = new Map();
    this.teamMembers = new Map();
    this.teamProperties = new Map();

    this.userId = 1;
    this.propertyId = 1;
    this.marketDataId = 1;
    this.savedSearchId = 1;
    this.savedPropertyId = 1;
    this.reportId = 1;
    this.propertyHistoryId = 1;
    this.marketPredictionId = 1;
    this.propertyRecommendationId = 1;
    
    // Initialize collaboration IDs
    this.sharedPropertyId = 1;
    this.propertyCommentId = 1;
    this.collaborationTeamId = 1;

    // Initialize with sample data
    this.initSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    const updatedUser: User = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const exists = this.users.has(id);
    if (exists) {
      this.users.delete(id);
      return true;
    }
    return false;
  }

  // Property methods
  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getAllProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async getPropertiesByFilters(filters: PropertyFilters): Promise<Property[]> {
    return Array.from(this.properties.values()).filter(property => {
      if (filters.location && !property.city.toLowerCase().includes(filters.location.toLowerCase()) && 
          !property.state.toLowerCase().includes(filters.location.toLowerCase()) && 
          !property.zipCode.includes(filters.location) &&
          !property.neighborhood?.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
      
      if (filters.propertyType && property.propertyType !== filters.propertyType) {
        return false;
      }
      
      if (filters.minPrice && Number(property.price) < filters.minPrice) {
        return false;
      }
      
      if (filters.maxPrice && Number(property.price) > filters.maxPrice) {
        return false;
      }
      
      if (filters.minBeds && property.bedrooms < filters.minBeds) {
        return false;
      }
      
      if (filters.minBaths && Number(property.bathrooms) < filters.minBaths) {
        return false;
      }
      
      if (filters.minSqft && Number(property.squareFeet) < filters.minSqft) {
        return false;
      }
      
      if (filters.maxSqft && Number(property.squareFeet) > filters.maxSqft) {
        return false;
      }
      
      if (filters.status && property.status !== filters.status) {
        return false;
      }
      
      if (filters.yearBuilt && property.yearBuilt !== filters.yearBuilt) {
        return false;
      }
      
      return true;
    });
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const id = this.propertyId++;
    const now = new Date();
    const newProperty: Property = { 
      ...property, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.properties.set(id, newProperty);
    return newProperty;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const existingProperty = this.properties.get(id);
    if (!existingProperty) {
      return undefined;
    }
    
    const updatedProperty: Property = { 
      ...existingProperty, 
      ...property, 
      updatedAt: new Date() 
    };
    
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  // Market data methods
  async getMarketData(id: number): Promise<MarketData | undefined> {
    return this.marketData.get(id);
  }

  async getMarketDataByLocation(city: string, state: string, zipCode?: string): Promise<MarketData[]> {
    return Array.from(this.marketData.values()).filter(data => {
      if (data.city.toLowerCase() !== city.toLowerCase()) {
        return false;
      }
      
      if (data.state.toLowerCase() !== state.toLowerCase()) {
        return false;
      }
      
      if (zipCode && data.zipCode !== zipCode) {
        return false;
      }
      
      return true;
    }).sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    });
  }

  async createMarketData(data: InsertMarketData): Promise<MarketData> {
    const id = this.marketDataId++;
    const now = new Date();
    const newData: MarketData = { ...data, id, createdAt: now };
    this.marketData.set(id, newData);
    return newData;
  }

  // Saved searches methods
  async getSavedSearchesByUser(userId: number): Promise<SavedSearch[]> {
    return Array.from(this.savedSearches.values()).filter(
      search => search.userId === userId
    );
  }

  async createSavedSearch(search: InsertSavedSearch): Promise<SavedSearch> {
    const id = this.savedSearchId++;
    const now = new Date();
    const newSearch: SavedSearch = { ...search, id, createdAt: now };
    this.savedSearches.set(id, newSearch);
    return newSearch;
  }

  async deleteSavedSearch(id: number): Promise<boolean> {
    return this.savedSearches.delete(id);
  }

  // Saved properties methods
  async getSavedPropertiesByUser(userId: number): Promise<SavedProperty[]> {
    return Array.from(this.savedProperties.values()).filter(
      saved => saved.userId === userId
    );
  }

  async createSavedProperty(saved: InsertSavedProperty): Promise<SavedProperty> {
    const id = this.savedPropertyId++;
    const now = new Date();
    const newSaved: SavedProperty = { ...saved, id, createdAt: now };
    this.savedProperties.set(id, newSaved);
    return newSaved;
  }

  async deleteSavedProperty(id: number): Promise<boolean> {
    return this.savedProperties.delete(id);
  }

  // Reports methods
  async getReport(id: number): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async getReportsByUser(userId: number): Promise<Report[]> {
    return Array.from(this.reports.values()).filter(
      report => report.userId === userId
    );
  }

  async createReport(report: InsertReport): Promise<Report> {
    const id = this.reportId++;
    const now = new Date();
    const newReport: Report = { ...report, id, createdAt: now };
    this.reports.set(id, newReport);
    return newReport;
  }

  async deleteReport(id: number): Promise<boolean> {
    return this.reports.delete(id);
  }

  // Property history methods
  async getPropertyHistory(propertyId: number): Promise<PropertyHistory[]> {
    return Array.from(this.propertyHistory.values())
      .filter(history => history.propertyId === propertyId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createPropertyHistory(history: InsertPropertyHistory): Promise<PropertyHistory> {
    const id = this.propertyHistoryId++;
    const newHistory: PropertyHistory = { ...history, id };
    this.propertyHistory.set(id, newHistory);
    return newHistory;
  }
  
  // AI Market Predictions methods
  async getMarketPrediction(id: number): Promise<MarketPrediction | undefined> {
    return this.marketPredictions.get(id);
  }

  async getMarketPredictionsByLocation(city: string, state: string, zipCode?: string): Promise<MarketPrediction[]> {
    const predictions = Array.from(this.marketPredictions.values()).filter(pred => 
      pred.city.toLowerCase() === city.toLowerCase() && 
      pred.state.toLowerCase() === state.toLowerCase() &&
      (!zipCode || pred.zipCode === zipCode)
    );
    
    // Sort by prediction date, newest first
    return predictions.sort((a, b) => 
      new Date(b.predictionDate).getTime() - new Date(a.predictionDate).getTime()
    );
  }

  async createMarketPrediction(prediction: InsertMarketPrediction): Promise<MarketPrediction> {
    const id = this.marketPredictionId++;
    const now = new Date();
    const newPrediction: MarketPrediction = { 
      ...prediction, 
      id, 
      createdAt: now,
      predictionDate: now
    };
    this.marketPredictions.set(id, newPrediction);
    return newPrediction;
  }
  
  // Property Recommendations methods
  async getPropertyRecommendation(id: number): Promise<PropertyRecommendation | undefined> {
    return this.propertyRecommendations.get(id);
  }

  async getPropertyRecommendationsByUser(userId: number): Promise<PropertyRecommendation[]> {
    return Array.from(this.propertyRecommendations.values())
      .filter(rec => rec.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createPropertyRecommendation(recommendation: InsertPropertyRecommendation): Promise<PropertyRecommendation> {
    const id = this.propertyRecommendationId++;
    const now = new Date();
    const newRecommendation: PropertyRecommendation = { ...recommendation, id, createdAt: now };
    this.propertyRecommendations.set(id, newRecommendation);
    return newRecommendation;
  }

  // Collaboration - Shared Properties methods
  async getSharedProperty(id: number): Promise<SharedProperty | undefined> {
    return this.sharedProperties.get(id);
  }

  async getSharedPropertyByToken(token: string): Promise<SharedProperty | undefined> {
    return Array.from(this.sharedProperties.values()).find(sp => sp.accessToken === token);
  }

  async getSharedPropertiesByOwner(ownerId: number): Promise<SharedProperty[]> {
    return Array.from(this.sharedProperties.values()).filter(sp => sp.ownerId === ownerId);
  }

  async getSharedPropertiesByEmail(email: string): Promise<SharedProperty[]> {
    return Array.from(this.sharedProperties.values()).filter(sp => sp.sharedWith === email);
  }

  async createSharedProperty(property: InsertSharedProperty): Promise<SharedProperty> {
    const id = this.sharedPropertyId++;
    const now = new Date();
    const newProperty: SharedProperty = { ...property, id, createdAt: now };
    this.sharedProperties.set(id, newProperty);
    return newProperty;
  }

  async updateSharedProperty(id: number, updates: Partial<SharedProperty>): Promise<SharedProperty | undefined> {
    const property = this.sharedProperties.get(id);
    if (!property) return undefined;

    const updatedProperty = { ...property, ...updates };
    this.sharedProperties.set(id, updatedProperty);
    return updatedProperty;
  }

  async deleteSharedProperty(id: number): Promise<boolean> {
    return this.sharedProperties.delete(id);
  }

  // Collaboration - Property Comments methods
  async getPropertyComment(id: number): Promise<PropertyComment | undefined> {
    return this.propertyComments.get(id);
  }

  async getPropertyCommentsByProperty(propertyId: number): Promise<PropertyComment[]> {
    return Array.from(this.propertyComments.values()).filter(pc => pc.propertyId === propertyId);
  }

  async getPropertyCommentsBySharedProperty(sharedPropertyId: number): Promise<PropertyComment[]> {
    return Array.from(this.propertyComments.values()).filter(pc => pc.sharedPropertyId === sharedPropertyId);
  }

  async createPropertyComment(comment: InsertPropertyComment): Promise<PropertyComment> {
    const id = this.propertyCommentId++;
    const now = new Date();
    const newComment: PropertyComment = { ...comment, id, createdAt: now };
    this.propertyComments.set(id, newComment);
    return newComment;
  }

  async deletePropertyComment(id: number): Promise<boolean> {
    return this.propertyComments.delete(id);
  }

  // Collaboration - Teams methods
  async getCollaborationTeam(id: number): Promise<CollaborationTeam | undefined> {
    return this.collaborationTeams.get(id);
  }

  async getTeamsByUserId(userId: number): Promise<CollaborationTeam[]> {
    // Find all teams where the user is a member
    const teamIds = Array.from(this.teamMembers.values())
      .filter(tm => tm.userId === userId)
      .map(tm => tm.teamId);
    
    // Get the team details for each team ID
    return teamIds.map(id => this.collaborationTeams.get(id)).filter(Boolean) as CollaborationTeam[];
  }

  async createCollaborationTeam(team: InsertCollaborationTeam): Promise<CollaborationTeam> {
    const id = this.collaborationTeamId++;
    const now = new Date();
    const newTeam: CollaborationTeam = { ...team, id, createdAt: now };
    this.collaborationTeams.set(id, newTeam);
    return newTeam;
  }

  async updateCollaborationTeam(id: number, updates: Partial<CollaborationTeam>): Promise<CollaborationTeam | undefined> {
    const team = this.collaborationTeams.get(id);
    if (!team) return undefined;

    const updatedTeam = { ...team, ...updates };
    this.collaborationTeams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteCollaborationTeam(id: number): Promise<boolean> {
    // First delete all associated team members and team properties
    Array.from(this.teamMembers.entries())
      .filter(([key, _]) => key.startsWith(`${id}-`))
      .forEach(([key, _]) => this.teamMembers.delete(key));
    
    Array.from(this.teamProperties.entries())
      .filter(([key, _]) => key.startsWith(`${id}-`))
      .forEach(([key, _]) => this.teamProperties.delete(key));
    
    // Then delete the team itself
    return this.collaborationTeams.delete(id);
  }

  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    // Create a composite key for the Map
    const key = `${member.teamId}-${member.userId}`;
    
    const now = new Date();
    const newMember: TeamMember = { ...member, joinedAt: now };
    
    this.teamMembers.set(key, newMember);
    return newMember;
  }

  async removeTeamMember(teamId: number, userId: number): Promise<boolean> {
    const key = `${teamId}-${userId}`;
    return this.teamMembers.delete(key);
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.entries())
      .filter(([key, _]) => key.startsWith(`${teamId}-`))
      .map(([_, member]) => member);
  }

  async addPropertyToTeam(teamProperty: InsertTeamProperty): Promise<TeamProperty> {
    // Create a composite key for the Map
    const key = `${teamProperty.teamId}-${teamProperty.propertyId}`;
    
    const now = new Date();
    const newTeamProperty: TeamProperty = { ...teamProperty, addedAt: now };
    
    this.teamProperties.set(key, newTeamProperty);
    return newTeamProperty;
  }

  async removePropertyFromTeam(teamId: number, propertyId: number): Promise<boolean> {
    const key = `${teamId}-${propertyId}`;
    return this.teamProperties.delete(key);
  }

  async getTeamProperties(teamId: number): Promise<Property[]> {
    // Get the property IDs for this team
    const propertyIds = Array.from(this.teamProperties.entries())
      .filter(([key, _]) => key.startsWith(`${teamId}-`))
      .map(([_, tp]) => tp.propertyId);
    
    // Get the property details for each property ID
    return propertyIds
      .map(id => this.properties.get(id))
      .filter(Boolean) as Property[];
  }

  // Initialize with sample data
  private initSampleData() {
    // Create sample user
    this.createUser({
      username: "demo",
      password: "password",
      email: "demo@example.com",
      fullName: "Demo User",
      role: "user",
    });

    // Create sample properties
    [
      {
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
          "https://images.unsplash.com/photo-1584622650111-993a426fbf0a",
          "https://images.unsplash.com/photo-1628744448840-55bdb2497bd4"
        ]),
        pricePerSqft: "785",
        description: "Beautiful home in Noe Valley featuring 4 bedrooms and 3 bathrooms, completely renovated in 2018.",
        features: JSON.stringify(["Hardwood Floors", "Central Air", "Renovated Kitchen", "Backyard", "Garage", "Fireplace"])
      },
      {
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
          "https://images.unsplash.com/photo-1600566752355-35792bedcfea",
          "https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d"
        ]),
        pricePerSqft: "767",
        description: "Modern townhouse in the vibrant Mission District with high-end finishes and spacious rooms.",
        features: JSON.stringify(["Smart Home", "High Ceilings", "Quartz Countertops", "Rooftop Deck", "Wine Cellar"])
      },
      {
        address: "789 California Avenue",
        city: "San Francisco",
        state: "CA",
        zipCode: "94109",
        neighborhood: "Pacific Heights",
        price: "1595000",
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: "1950",
        lotSize: "0",
        yearBuilt: 2018,
        propertyType: "Condo",
        status: "Pending",
        daysOnMarket: 8,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
          "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
          "https://images.unsplash.com/photo-1565183997392-2f6f122e5912",
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267"
        ]),
        pricePerSqft: "818",
        description: "Luxury condominium in Pacific Heights with stunning city views and high-end amenities.",
        features: JSON.stringify(["Concierge", "Gym", "City Views", "Balcony", "Heated Floors", "Parking"])
      },
      {
        address: "321 Hayes Street",
        city: "San Francisco",
        state: "CA",
        zipCode: "94117",
        neighborhood: "Haight-Ashbury",
        price: "1895000",
        bedrooms: 4,
        bathrooms: 3.5,
        squareFeet: "2400",
        lotSize: "3500",
        yearBuilt: 1908,
        propertyType: "Single Family",
        status: "Sold",
        daysOnMarket: 15,
        images: JSON.stringify([
          "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf",
          "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde",
          "https://images.unsplash.com/photo-1600607687120-9e4bbebc891c",
          "https://images.unsplash.com/photo-1560440021-33f9b867899d",
          "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf"
        ]),
        pricePerSqft: "790",
        description: "Historic Victorian home in Haight-Ashbury with original details and modern updates.",
        features: JSON.stringify(["Victorian Details", "Bay Windows", "Crown Molding", "Updated Kitchen", "Garden"])
      }
    ].forEach(property => {
      this.createProperty(property as InsertProperty);
    });

    // Create sample market data for San Francisco
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const medianPrices = [1200000, 1180000, 1250000, 1300000, 1350000, 1400000, 1450000, 1500000, 1480000];
    const daysOnMarket = [35, 34, 33, 32, 31, 30, 29, 28, 30];
    
    months.forEach((month, index) => {
      this.createMarketData({
        city: "San Francisco",
        state: "CA",
        zipCode: "94101",
        medianPrice: medianPrices[index].toString(),
        averagePricePerSqft: (medianPrices[index] / 1500).toString(),
        daysOnMarket: daysOnMarket[index],
        activeListings: 400 + Math.floor(Math.random() * 50),
        inventoryMonths: "1.8",
        saleToListRatio: "102",
        priceReductions: "12",
        marketType: "seller",
        month: month,
        year: 2023
      });
    });

    // Create property history for first property
    [
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
        description: "Previous sale"
      }
    ].forEach(history => {
      this.createPropertyHistory(history as InsertPropertyHistory);
    });

    // Create saved search for demo user
    this.createSavedSearch({
      userId: 1,
      location: "San Francisco, CA",
      propertyType: "Single Family",
      minPrice: "1000000",
      maxPrice: "2000000",
      minBeds: 3,
      minBaths: 2,
      minSqft: "1500",
      maxSqft: "3000"
    });

    // Create saved property for demo user
    this.createSavedProperty({
      userId: 1,
      propertyId: 1,
      notes: "Great property in a nice neighborhood"
    });

    // Create report for demo user
    this.createReport({
      userId: 1,
      title: "San Francisco Properties Comparison",
      description: "Comparison of 3+ bedroom homes in San Francisco",
      properties: JSON.stringify([1, 2, 4])
    });
  }
}

export class DatabaseStorage implements IStorage {
  // AI prediction methods
  async getMarketPrediction(id: number): Promise<MarketPrediction | undefined> {
    const [prediction] = await db.select().from(marketPredictions).where(eq(marketPredictions.id, id));
    return prediction;
  }

  async getMarketPredictionsByLocation(city: string, state: string, zipCode?: string): Promise<MarketPrediction[]> {
    // Build the initial query with city and state filter
    let query = db.select().from(marketPredictions)
      .where(
        and(
          eq(marketPredictions.city, city),
          eq(marketPredictions.state, state)
        )
      );
    
    // Add zipCode filter if provided
    if (zipCode) {
      query = query.where(eq(marketPredictions.zipCode, zipCode));
    }
    
    // Execute the query and sort the results by prediction date descending
    const results = await query;
    return results.sort((a, b) => 
      new Date(b.predictionDate).getTime() - new Date(a.predictionDate).getTime()
    );
  }

  async createMarketPrediction(prediction: InsertMarketPrediction): Promise<MarketPrediction> {
    const [newPrediction] = await db.insert(marketPredictions)
      .values(prediction)
      .returning();
    return newPrediction;
  }
  
  // Property recommendation methods
  async getPropertyRecommendation(id: number): Promise<PropertyRecommendation | undefined> {
    const [recommendation] = await db.select().from(propertyRecommendations)
      .where(eq(propertyRecommendations.id, id));
    return recommendation;
  }

  async getPropertyRecommendationsByUser(userId: number): Promise<PropertyRecommendation[]> {
    return db.select().from(propertyRecommendations)
      .where(eq(propertyRecommendations.userId, userId))
      .orderBy(desc(propertyRecommendations.createdAt));
  }

  async createPropertyRecommendation(recommendation: InsertPropertyRecommendation): Promise<PropertyRecommendation> {
    const [newRecommendation] = await db.insert(propertyRecommendations)
      .values(recommendation)
      .returning();
    return newRecommendation;
  }
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: insertUser.role || 'user',
        fullName: insertUser.fullName || null
      })
      .returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    // Make sure null values are properly handled
    const updateData = { ...userData };
    if (userData.fullName === undefined) {
      updateData.fullName = null;
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
      
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Property methods
  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async getAllProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }

  async getPropertiesByFilters(filters: PropertyFilters): Promise<Property[]> {
    let query = db.select().from(properties);
    
    // Build conditions based on filters
    const conditions = [];
    
    if (filters.location) {
      const locationLower = `%${filters.location.toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${properties.city}) LIKE ${locationLower}`,
          sql`LOWER(${properties.state}) LIKE ${locationLower}`,
          sql`LOWER(${properties.zipCode}) LIKE ${locationLower}`,
          sql`LOWER(COALESCE(${properties.neighborhood}, '')) LIKE ${locationLower}`
        )
      );
    }
    
    // Filter by zip code exact match
    if (filters.zipCode) {
      conditions.push(eq(properties.zipCode, filters.zipCode));
    }

    if (filters.propertyType) {
      conditions.push(eq(properties.propertyType, filters.propertyType));
    }

    if (filters.minPrice) {
      conditions.push(gte(properties.price, filters.minPrice.toString()));
    }

    if (filters.maxPrice) {
      conditions.push(lte(properties.price, filters.maxPrice.toString()));
    }

    // Beds filtering - exact or range
    if (filters.minBeds) {
      conditions.push(gte(properties.bedrooms, filters.minBeds));
    }
    
    if (filters.maxBeds) {
      conditions.push(lte(properties.bedrooms, filters.maxBeds));
    }

    // Baths filtering - exact or range
    if (filters.minBaths && !isNaN(Number(filters.minBaths))) {
      conditions.push(gte(properties.bathrooms, filters.minBaths.toString()));
    }
    
    if (filters.maxBaths && !isNaN(Number(filters.maxBaths))) {
      conditions.push(lte(properties.bathrooms, filters.maxBaths.toString()));
    }

    // Square footage filtering
    if (filters.minSqft) {
      conditions.push(gte(properties.squareFeet, filters.minSqft.toString()));
    }

    if (filters.maxSqft) {
      conditions.push(lte(properties.squareFeet, filters.maxSqft.toString()));
    }

    // Status filtering - single status or list of statuses
    if (filters.status) {
      conditions.push(eq(properties.status, filters.status));
    } else if (filters.statusList && filters.statusList.length > 0) {
      const statusConditions = filters.statusList.map(status => eq(properties.status, status));
      conditions.push(or(...statusConditions));
    }

    // Year built filtering
    if (filters.yearBuilt && filters.yearBuilt !== 'any_year') {
      // Only apply the filter if it's not "any_year"
      // Handle yearBuilt as either string or number
      const yearBuiltValue = 
        typeof filters.yearBuilt === 'string' && !isNaN(parseInt(filters.yearBuilt)) 
          ? parseInt(filters.yearBuilt) 
          : filters.yearBuilt;
      conditions.push(eq(properties.yearBuilt, yearBuiltValue));
    }
    
    // Basement filtering
    if (filters.hasBasement !== undefined) {
      conditions.push(eq(properties.hasBasement, filters.hasBasement));
    }
    
    // Garage filtering
    if (filters.hasGarage !== undefined) {
      conditions.push(eq(properties.hasGarage, filters.hasGarage));
    }
    
    if (filters.minGarageSpaces) {
      conditions.push(gte(properties.garageSpaces, filters.minGarageSpaces));
    }
    
    // Sale date filtering for sold comps
    if (filters.saleDate) {
      conditions.push(eq(properties.saleDate, filters.saleDate));
    }
    
    if (filters.saleDateStart) {
      const startDate = new Date(filters.saleDateStart);
      conditions.push(gte(properties.saleDate, startDate));
    }
    
    if (filters.saleDateEnd) {
      const endDate = new Date(filters.saleDateEnd);
      conditions.push(lte(properties.saleDate, endDate));
    }
    
    // Distance-based search using lat/lng (to be implemented with a geospatial function)
    // This is a basic implementation and would need to be improved with proper distance calculation 
    if (filters.lat && filters.lng && filters.radius) {
      // Simple bounding box as placeholder - proper implementation would use PostGIS or similar
      // Approximate conversion from miles to degrees (rough estimation)
      const milesPerDegree = 69; // ~69 miles per degree of latitude
      const degreeDelta = filters.radius / milesPerDegree;
      
      conditions.push(sql`${properties.latitude}::numeric >= ${(filters.lat - degreeDelta).toString()}`);
      conditions.push(sql`${properties.latitude}::numeric <= ${(filters.lat + degreeDelta).toString()}`);
      
      // Longitude degrees vary based on latitude, this is a simplification
      conditions.push(sql`${properties.longitude}::numeric >= ${(filters.lng - degreeDelta).toString()}`);
      conditions.push(sql`${properties.longitude}::numeric <= ${(filters.lng + degreeDelta).toString()}`);
    }

    // Apply conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query;
  }

  async createProperty(property: InsertProperty): Promise<Property> {
    const now = new Date();
    const [createdProperty] = await db
      .insert(properties)
      .values({
        ...property,
        yearBuilt: property.yearBuilt || null,
        neighborhood: property.neighborhood || null,
        description: property.description || null,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return createdProperty;
  }

  async updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined> {
    const now = new Date();
    const [updatedProperty] = await db
      .update(properties)
      .set({
        ...property,
        updatedAt: now
      })
      .where(eq(properties.id, id))
      .returning();
    return updatedProperty;
  }

  // Market data methods
  async getMarketData(id: number): Promise<MarketData | undefined> {
    const [data] = await db.select().from(marketData).where(eq(marketData.id, id));
    return data;
  }

  async getMarketDataByLocation(city: string, state: string, zipCode?: string): Promise<MarketData[]> {
    let query = db.select().from(marketData)
      .where(
        and(
          eq(marketData.city, city),
          eq(marketData.state, state)
        )
      );
    
    // Use the correct column name (zip_code) instead of the camelCase property name (zipCode)
    if (zipCode) {
      // marketData.zipCode maps to the database column zip_code
      query = query.where(eq(marketData.zipCode, zipCode));
    }
    
    // Order by year and month descending
    const results = await query;
    return results.sort((a, b) => 
      b.year - a.year || b.month - a.month
    );
  }

  async createMarketData(data: InsertMarketData): Promise<MarketData> {
    const [createdData] = await db
      .insert(marketData)
      .values({
        ...data,
        daysOnMarket: data.daysOnMarket || null,
        medianPrice: data.medianPrice || null,
        averagePricePerSqft: data.averagePricePerSqft || null,
        activeListings: data.activeListings || null,
        soldPerMonth: data.soldPerMonth || null,
        medianRent: data.medianRent || null,
        rentToValue: data.rentToValue || null,
        marketType: data.marketType || null
      })
      .returning();
    return createdData;
  }

  // Saved searches methods
  async getSavedSearchesByUser(userId: number): Promise<SavedSearch[]> {
    return await db.select().from(savedSearches).where(eq(savedSearches.userId, userId));
  }

  async createSavedSearch(search: InsertSavedSearch): Promise<SavedSearch> {
    // Ensure the search has name and filters properties
    if (!search.name || !search.filters) {
      throw new Error("Search name and filters are required");
    }
    
    const [createdSearch] = await db
      .insert(savedSearches)
      .values({
        userId: search.userId,
        name: search.name,
        filters: search.filters
      })
      .returning();
    return createdSearch;
  }

  async deleteSavedSearch(id: number): Promise<boolean> {
    const result = await db.delete(savedSearches).where(eq(savedSearches.id, id)).returning();
    return result.length > 0;
  }

  // Saved properties methods
  async getSavedPropertiesByUser(userId: number): Promise<SavedProperty[]> {
    return await db.select().from(savedProperties).where(eq(savedProperties.userId, userId));
  }

  async createSavedProperty(saved: InsertSavedProperty): Promise<SavedProperty> {
    const [createdSaved] = await db
      .insert(savedProperties)
      .values({
        ...saved,
        notes: saved.notes || null
      })
      .returning();
    return createdSaved;
  }

  async deleteSavedProperty(id: number): Promise<boolean> {
    const result = await db.delete(savedProperties).where(eq(savedProperties.id, id)).returning();
    return result.length > 0;
  }

  // Reports methods
  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async getReportsByUser(userId: number): Promise<Report[]> {
    return await db.select().from(reports).where(eq(reports.userId, userId));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [createdReport] = await db
      .insert(reports)
      .values({
        ...report,
        description: report.description || null
      })
      .returning();
    return createdReport;
  }

  async deleteReport(id: number): Promise<boolean> {
    const result = await db.delete(reports).where(eq(reports.id, id)).returning();
    return result.length > 0;
  }

  // Property history methods
  async getPropertyHistory(propertyId: number): Promise<PropertyHistory[]> {
    return await db
      .select()
      .from(propertyHistory)
      .where(eq(propertyHistory.propertyId, propertyId))
      .orderBy(desc(propertyHistory.date));
  }

  async createPropertyHistory(history: InsertPropertyHistory): Promise<PropertyHistory> {
    const [createdHistory] = await db
      .insert(propertyHistory)
      .values({
        ...history,
        price: history.price || null,
        description: history.description || null
      })
      .returning();
    return createdHistory;
  }

  // Collaboration - Shared Properties methods
  async getSharedProperty(id: number): Promise<SharedProperty | undefined> {
    const [property] = await db.select().from(sharedProperties).where(eq(sharedProperties.id, id));
    return property;
  }

  async getSharedPropertyByToken(token: string): Promise<SharedProperty | undefined> {
    const [property] = await db.select().from(sharedProperties).where(eq(sharedProperties.accessToken, token));
    return property;
  }

  async getSharedPropertiesByOwner(ownerId: number): Promise<SharedProperty[]> {
    return await db.select().from(sharedProperties).where(eq(sharedProperties.ownerId, ownerId));
  }

  async getSharedPropertiesByEmail(email: string): Promise<SharedProperty[]> {
    return await db.select().from(sharedProperties).where(eq(sharedProperties.sharedWith, email));
  }

  async createSharedProperty(property: InsertSharedProperty): Promise<SharedProperty> {
    const [newProperty] = await db.insert(sharedProperties)
      .values(property)
      .returning();
    return newProperty;
  }

  async updateSharedProperty(id: number, updates: Partial<SharedProperty>): Promise<SharedProperty | undefined> {
    const [updatedProperty] = await db.update(sharedProperties)
      .set(updates)
      .where(eq(sharedProperties.id, id))
      .returning();
    return updatedProperty;
  }

  async deleteSharedProperty(id: number): Promise<boolean> {
    const result = await db.delete(sharedProperties).where(eq(sharedProperties.id, id));
    return result.rowCount > 0;
  }
  
  // Collaboration - Property Comments methods
  async getPropertyComment(id: number): Promise<PropertyComment | undefined> {
    const [comment] = await db.select().from(propertyComments).where(eq(propertyComments.id, id));
    return comment;
  }

  async getPropertyCommentsByProperty(propertyId: number): Promise<PropertyComment[]> {
    return await db.select().from(propertyComments).where(eq(propertyComments.propertyId, propertyId));
  }

  async getPropertyCommentsBySharedProperty(sharedPropertyId: number): Promise<PropertyComment[]> {
    return await db.select().from(propertyComments).where(eq(propertyComments.sharedPropertyId, sharedPropertyId));
  }

  async createPropertyComment(comment: InsertPropertyComment): Promise<PropertyComment> {
    const [newComment] = await db.insert(propertyComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async deletePropertyComment(id: number): Promise<boolean> {
    const result = await db.delete(propertyComments).where(eq(propertyComments.id, id));
    return result.rowCount > 0;
  }
  
  // Collaboration - Teams methods
  async getCollaborationTeam(id: number): Promise<CollaborationTeam | undefined> {
    const [team] = await db.select().from(collaborationTeams).where(eq(collaborationTeams.id, id));
    return team;
  }

  async getTeamsByUserId(userId: number): Promise<CollaborationTeam[]> {
    // First get all team memberships for this user
    const memberRecords = await db.select().from(teamMembers)
      .where(eq(teamMembers.userId, userId));
    
    if (memberRecords.length === 0) {
      return [];
    }
    
    // Then get the teams corresponding to those memberships
    const teamIds = memberRecords.map(member => member.teamId);
    return await db.select().from(collaborationTeams)
      .where(
        sql`${collaborationTeams.id} IN (${sql.join(teamIds.map(id => sql`${id}`), sql`, `)})`
      );
  }

  async createCollaborationTeam(team: InsertCollaborationTeam): Promise<CollaborationTeam> {
    const [newTeam] = await db.insert(collaborationTeams)
      .values(team)
      .returning();
    return newTeam;
  }

  async updateCollaborationTeam(id: number, updates: Partial<CollaborationTeam>): Promise<CollaborationTeam | undefined> {
    const [updatedTeam] = await db.update(collaborationTeams)
      .set(updates)
      .where(eq(collaborationTeams.id, id))
      .returning();
    return updatedTeam;
  }

  async deleteCollaborationTeam(id: number): Promise<boolean> {
    // First delete all team members
    await db.delete(teamMembers).where(eq(teamMembers.teamId, id));
    
    // Then delete all team properties
    await db.delete(teamProperties).where(eq(teamProperties.teamId, id));
    
    // Finally delete the team
    const result = await db.delete(collaborationTeams).where(eq(collaborationTeams.id, id));
    return result.rowCount > 0;
  }

  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db.insert(teamMembers)
      .values(member)
      .returning();
    return newMember;
  }

  async removeTeamMember(teamId: number, userId: number): Promise<boolean> {
    const result = await db.delete(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      );
    return result.rowCount > 0;
  }

  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return await db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
  }

  async addPropertyToTeam(teamProperty: InsertTeamProperty): Promise<TeamProperty> {
    const [newTeamProperty] = await db.insert(teamProperties)
      .values(teamProperty)
      .returning();
    return newTeamProperty;
  }

  async removePropertyFromTeam(teamId: number, propertyId: number): Promise<boolean> {
    const result = await db.delete(teamProperties)
      .where(
        and(
          eq(teamProperties.teamId, teamId),
          eq(teamProperties.propertyId, propertyId)
        )
      );
    return result.rowCount > 0;
  }

  async getTeamProperties(teamId: number): Promise<Property[]> {
    // First get all team property records for this team
    const teamPropertyRecords = await db.select().from(teamProperties)
      .where(eq(teamProperties.teamId, teamId));
    
    if (teamPropertyRecords.length === 0) {
      return [];
    }
    
    // Then get the properties corresponding to those records
    const propertyIds = teamPropertyRecords.map(record => record.propertyId);
    return await db.select().from(properties)
      .where(
        sql`${properties.id} IN (${sql.join(propertyIds.map(id => sql`${id}`), sql`, `)})`
      );
  }
}

// Use database storage instead of in-memory storage
export const storage = new DatabaseStorage();
