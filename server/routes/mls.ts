import { Router } from 'express';
import { fetchPropertiesFromMLS, syncLastUpdated } from '../services/mlsService';
import { isAdmin, hasPermission, Permission } from '@shared/permissions';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { properties } from '@shared/schema';

const router = Router();

// Get current MLS synchronization status
router.get('/status', async (req, res) => {
  try {
    // Check if MLS API key is configured
    const mlsApiKey = process.env.MLS_API_KEY;
    const mlsApiEndpoint = process.env.MLS_API_ENDPOINT;
    
    if (!mlsApiKey || !mlsApiEndpoint) {
      return res.json({
        status: 'inactive',
        message: 'MLS API key or endpoint not configured',
        lastSync: syncLastUpdated
      });
    }
    
    // Count properties with externalId not null (MLS properties)
    const mlsPropertiesCount = await db
      .select({ count: db.fn.count() })
      .from(properties)
      .where(
        eq(properties.externalId, null)
      );
    
    return res.json({
      status: 'active',
      message: 'MLS integration is active',
      lastSync: syncLastUpdated,
      propertiesCount: mlsPropertiesCount[0].count
    });
  } catch (error) {
    console.error('Error checking MLS status:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Trigger manual synchronization of MLS data
router.post('/synchronize', async (req, res) => {
  try {
    // Check if user has permission to manage MLS integration
    if (!req.isAuthenticated() || !hasPermission(req.user, Permission.MANAGE_MLS_INTEGRATION)) {
      return res.status(403).json({
        error: 'You do not have permission to synchronize MLS data'
      });
    }
    
    // Check if MLS API key is configured
    const mlsApiKey = process.env.MLS_API_KEY;
    const mlsApiEndpoint = process.env.MLS_API_ENDPOINT;
    
    if (!mlsApiKey || !mlsApiEndpoint) {
      return res.status(400).json({
        error: 'MLS API key or endpoint not configured'
      });
    }
    
    // Fetch latest properties from MLS
    const { importedProperties, errors } = await fetchPropertiesFromMLS({
      force: true,  // Force refresh all properties
      limit: 50     // Limit to 50 properties for manual sync
    });
    
    // Update the last updated timestamp
    syncLastUpdated.setTime(Date.now());
    
    return res.json({
      status: 'success',
      message: `Successfully synced ${importedProperties.length} properties`,
      count: importedProperties.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error synchronizing MLS data:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;