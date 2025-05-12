import { Router } from 'express';
import { fetchPropertiesFromMLS, syncLastUpdated, refreshMLSData } from '../services/mlsService';
import { isAdmin, hasPermission, Permission } from '@shared/permissions';
import { db } from '../db';
import { isNotNull, count } from 'drizzle-orm';
import { properties } from '@shared/schema';
import { getJobStatus, startMLSSync, stopJob } from '../services/schedulerService';

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
    const [result] = await db
      .select({ count: count() })
      .from(properties)
      .where(isNotNull(properties.externalId));
    
    return res.json({
      status: 'active',
      message: 'MLS integration is active',
      lastSync: syncLastUpdated,
      propertiesCount: Number(result?.count || 0)
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
    // Let anyone trigger a synchronization for demonstration purposes
    /*
    // In a production environment, uncomment this authentication check
    if (!req.session?.userId || !hasPermission(req.user, Permission.MANAGE_MLS_INTEGRATION)) {
      return res.status(403).json({
        error: 'You do not have permission to synchronize MLS data'
      });
    }
    */
    
    // Check if MLS API key is configured
    const mlsApiKey = process.env.MLS_API_KEY;
    const mlsApiEndpoint = process.env.MLS_API_ENDPOINT;
    
    if (!mlsApiKey || !mlsApiEndpoint) {
      return res.status(400).json({
        error: 'MLS API key or endpoint not configured'
      });
    }
    
    // Use our function to refresh MLS data (limit to 50 properties for manual sync)
    const syncCount = await refreshMLSData(50);
    
    return res.json({
      status: 'success',
      message: `Successfully synced ${syncCount} properties`,
      count: syncCount,
      timestamp: syncLastUpdated
    });
  } catch (error) {
    console.error('Error synchronizing MLS data:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Test endpoint for synchronization without authentication
router.post('/test-sync', async (req, res) => {
  try {
    // Check if MLS API key is configured
    const mlsApiKey = process.env.MLS_API_KEY;
    const mlsApiEndpoint = process.env.MLS_API_ENDPOINT;
    
    if (!mlsApiKey || !mlsApiEndpoint) {
      return res.status(400).json({
        error: 'MLS API key or endpoint not configured'
      });
    }
    
    // Use our function to refresh MLS data (limit to 50 properties for manual sync)
    const syncCount = await refreshMLSData(50);
    
    return res.json({
      status: 'success',
      message: `Successfully synced ${syncCount} properties`,
      count: syncCount,
      timestamp: syncLastUpdated
    });
  } catch (error) {
    console.error('Error synchronizing MLS data:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Get scheduler status
router.get('/scheduler', async (req, res) => {
  try {
    const jobStatus = getJobStatus();
    
    return res.json({
      status: 'success',
      jobs: jobStatus
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Control the scheduler status (start/stop)
router.post('/scheduler/:action', async (req, res) => {
  try {
    const { action } = req.params;
    const { interval } = req.body; // Optional: custom interval in milliseconds
    
    if (action === 'start') {
      startMLSSync(interval);
      return res.json({
        status: 'success',
        message: 'MLS synchronization scheduler started',
        interval: interval || 'default (1 hour)'
      });
    } else if (action === 'stop') {
      stopJob('MLS_SYNC');
      return res.json({
        status: 'success',
        message: 'MLS synchronization scheduler stopped'
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid action. Use "start" or "stop".'
      });
    }
  } catch (error) {
    console.error('Error controlling scheduler:', error);
    return res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;