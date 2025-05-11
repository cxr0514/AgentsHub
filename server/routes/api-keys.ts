import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Path to the API keys file
const API_KEYS_FILE = path.join(process.cwd(), '.env.api-keys');

// Interface for API key data
interface ApiKey {
  id: string;
  name: string;
  key: string;
  service: string;
  createdAt: string;
}

// Initialize API keys file if it doesn't exist
function initializeApiKeysFile() {
  if (!fs.existsSync(API_KEYS_FILE)) {
    fs.writeFileSync(API_KEYS_FILE, JSON.stringify([]));
  }
}

// Get all API keys
function getApiKeys(): ApiKey[] {
  initializeApiKeysFile();
  const data = fs.readFileSync(API_KEYS_FILE, 'utf8');
  return JSON.parse(data);
}

// Save API keys to file
function saveApiKeys(apiKeys: ApiKey[]) {
  fs.writeFileSync(API_KEYS_FILE, JSON.stringify(apiKeys, null, 2));
}

// Add a new API key
export function addApiKey(req: Request, res: Response) {
  try {
    const { name, key, service } = req.body;
    
    if (!name || !key || !service) {
      return res.status(400).json({ error: 'Name, key, and service are required' });
    }
    
    const apiKeys = getApiKeys();
    
    // Check if a key with this name already exists
    const existingKey = apiKeys.find(k => k.name === name);
    if (existingKey) {
      return res.status(400).json({ error: `API key with name '${name}' already exists` });
    }
    
    // Add the new key
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name,
      key,
      service,
      createdAt: new Date().toISOString()
    };
    
    apiKeys.push(newKey);
    saveApiKeys(apiKeys);
    
    // Set the environment variable
    process.env[name] = key;
    
    return res.status(201).json({ success: true, key: { ...newKey, key: '•'.repeat(key.length) } });
  } catch (error) {
    console.error('Error adding API key:', error);
    return res.status(500).json({ error: 'Failed to add API key' });
  }
}

// Get all API keys (masked)
export function getApiKeysList(req: Request, res: Response) {
  try {
    const apiKeys = getApiKeys().map(key => ({
      ...key,
      key: '•'.repeat(key.key.length) // Mask the actual key values
    }));
    
    return res.status(200).json(apiKeys);
  } catch (error) {
    console.error('Error getting API keys:', error);
    return res.status(500).json({ error: 'Failed to get API keys' });
  }
}

// Delete an API key by ID
export function deleteApiKey(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'API key ID is required' });
    }
    
    const apiKeys = getApiKeys();
    const keyToDelete = apiKeys.find(k => k.id === id);
    
    if (!keyToDelete) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    // Remove the key from the array
    const updatedKeys = apiKeys.filter(k => k.id !== id);
    saveApiKeys(updatedKeys);
    
    // Remove from environment variables
    delete process.env[keyToDelete.name];
    
    return res.status(200).json({ success: true, id });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return res.status(500).json({ error: 'Failed to delete API key' });
  }
}

// Load all API keys into environment variables on startup
export function loadApiKeysIntoEnv() {
  try {
    const apiKeys = getApiKeys();
    apiKeys.forEach(key => {
      process.env[key.name] = key.key;
    });
    console.log(`Loaded ${apiKeys.length} API keys into environment variables`);
  } catch (error) {
    console.error('Error loading API keys into environment:', error);
  }
}