import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { randomBytes } from "crypto";
import { z } from "zod";

// API key interface
interface ApiKey {
  id: string;
  name: string;
  key: string;
  service: string;
  createdAt: string;
}

// API key file path
const API_KEYS_FILE = ".env.api-keys";

// Schema for API key creation
const apiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  service: z.string().min(1, "Service is required"),
});

// Initialize API keys file if it doesn't exist
function initializeApiKeysFile() {
  if (!fs.existsSync(API_KEYS_FILE)) {
    fs.writeFileSync(API_KEYS_FILE, "# API Keys\n", "utf-8");
  }
}

// Get API keys from file
function getApiKeys(): ApiKey[] {
  try {
    initializeApiKeysFile();
    
    const fileContent = fs.readFileSync(API_KEYS_FILE, "utf-8");
    const lines = fileContent.split("\n");
    
    const apiKeys: ApiKey[] = [];
    const commentPattern = /^#\s*API_KEY_([a-zA-Z0-9_-]+)=(.+?)\|(.+?)\|(.+?)\|(.+)$/;
    
    for (const line of lines) {
      const match = line.match(commentPattern);
      if (match) {
        apiKeys.push({
          id: match[1],
          name: match[2],
          service: match[3],
          key: match[4],
          createdAt: match[5],
        });
      }
    }
    
    return apiKeys;
  } catch (error) {
    console.error("Error loading API keys:", error);
    return [];
  }
}

// Save API keys to file
function saveApiKeys(apiKeys: ApiKey[]) {
  try {
    initializeApiKeysFile();
    
    let fileContent = "# API Keys\n";
    
    // Add API keys as comments for reference
    for (const apiKey of apiKeys) {
      fileContent += `# API_KEY_${apiKey.id}=${apiKey.name}|${apiKey.service}|${apiKey.key}|${apiKey.createdAt}\n`;
    }
    
    // Add environment variables
    for (const apiKey of apiKeys) {
      fileContent += `${apiKey.service.toUpperCase()}_API_KEY=${apiKey.key}\n`;
    }
    
    fs.writeFileSync(API_KEYS_FILE, fileContent, "utf-8");
  } catch (error) {
    console.error("Error saving API keys:", error);
  }
}

// Add API key endpoint
export function addApiKey(req: Request, res: Response) {
  try {
    // Validate request body
    const validatedData = apiKeySchema.parse(req.body);
    
    // Generate a new API key
    const keyId = randomBytes(6).toString("hex");
    const apiKey = randomBytes(32).toString("hex");
    
    // Create new API key
    const newKey: ApiKey = {
      id: keyId,
      name: validatedData.name,
      service: validatedData.service.toLowerCase(),
      key: apiKey,
      createdAt: new Date().toISOString(),
    };
    
    // Get existing API keys
    const apiKeys = getApiKeys();
    
    // Check if service already has a key
    const existingServiceIndex = apiKeys.findIndex(
      (key) => key.service.toLowerCase() === newKey.service.toLowerCase()
    );
    
    if (existingServiceIndex !== -1) {
      // Update existing service key
      apiKeys[existingServiceIndex] = newKey;
    } else {
      // Add new API key
      apiKeys.push(newKey);
    }
    
    // Save API keys
    saveApiKeys(apiKeys);
    
    // Load API keys into environment
    loadApiKeysIntoEnv();
    
    return res.status(201).json(newKey);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    console.error("Add API key error:", error);
    return res.status(500).json({ message: "Failed to add API key" });
  }
}

// Get API keys list endpoint
export function getApiKeysList(req: Request, res: Response) {
  try {
    const apiKeys = getApiKeys();
    
    // Return API keys without the actual key value for security
    const safeApiKeys = apiKeys.map(({ key, ...rest }) => ({
      ...rest,
      key: `${key.substring(0, 4)}...${key.substring(key.length - 4)}`,
    }));
    
    return res.status(200).json(safeApiKeys);
  } catch (error) {
    console.error("Get API keys error:", error);
    return res.status(500).json({ message: "Failed to get API keys" });
  }
}

// Delete API key endpoint
export function deleteApiKey(req: Request, res: Response) {
  try {
    const keyId = req.params.keyId;
    
    // Get existing API keys
    const apiKeys = getApiKeys();
    
    // Filter out the API key to delete
    const updatedApiKeys = apiKeys.filter((key) => key.id !== keyId);
    
    // Check if any API key was removed
    if (updatedApiKeys.length === apiKeys.length) {
      return res.status(404).json({ message: "API key not found" });
    }
    
    // Save updated API keys
    saveApiKeys(updatedApiKeys);
    
    // Load API keys into environment
    loadApiKeysIntoEnv();
    
    return res.status(200).json({ message: "API key deleted successfully" });
  } catch (error) {
    console.error("Delete API key error:", error);
    return res.status(500).json({ message: "Failed to delete API key" });
  }
}

// Load API keys into environment
export function loadApiKeysIntoEnv() {
  try {
    const apiKeys = getApiKeys();
    
    for (const apiKey of apiKeys) {
      process.env[`${apiKey.service.toUpperCase()}_API_KEY`] = apiKey.key;
    }
    
    console.log(`Loaded ${apiKeys.length} API keys into environment variables`);
  } catch (error) {
    console.error("Error loading API keys into environment:", error);
  }
}