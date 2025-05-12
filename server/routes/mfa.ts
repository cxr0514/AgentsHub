import { Router, Request, Response } from 'express';
import { authenticator } from 'otplib';
import { MFAService } from '../services/mfaService';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

/**
 * Get the current MFA status for the authenticated user
 */
router.get('/status', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    return res.json({
      enabled: user.mfaEnabled || false
    });
  } catch (error) {
    console.error('Error getting MFA status:', error);
    return res.status(500).json({ error: 'Failed to get MFA status' });
  }
});

/**
 * Generate a new MFA secret and QR code for setup
 */
router.post('/generate', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // If MFA is already enabled, don't allow generating a new secret
    if (user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA is already enabled for this account' });
    }
    
    const { secret, qrCode } = await MFAService.generateSecret(user);
    
    return res.json({ secret, qrCode });
  } catch (error) {
    console.error('Error generating MFA secret:', error);
    return res.status(500).json({ error: 'Failed to generate MFA secret' });
  }
});

/**
 * Verify a token against a secret during MFA setup
 */
router.post('/verify', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { token, secret } = req.body;
    
    if (!token || !secret) {
      return res.status(400).json({ error: 'Token and secret are required' });
    }
    
    const isValid = MFAService.verifyToken(token, secret);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Generate recovery codes for the user
    const recoveryCodes = MFAService.generateRecoveryCodes();
    
    return res.json({ 
      verified: true,
      recoveryCodes 
    });
  } catch (error) {
    console.error('Error verifying MFA token:', error);
    return res.status(500).json({ error: 'Failed to verify token' });
  }
});

/**
 * Enable MFA for the authenticated user
 */
router.post('/enable', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { secret } = req.body;
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!secret) {
      return res.status(400).json({ error: 'Secret is required' });
    }
    
    // If MFA is already enabled, don't allow enabling it again
    if (user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA is already enabled for this account' });
    }
    
    // Generate recovery codes
    const recoveryCodes = MFAService.generateRecoveryCodes();
    
    // Enable MFA for the user
    await MFAService.enableMFA(user.id, secret, recoveryCodes);
    
    return res.json({ 
      enabled: true,
      recoveryCodes 
    });
  } catch (error) {
    console.error('Error enabling MFA:', error);
    return res.status(500).json({ error: 'Failed to enable MFA' });
  }
});

/**
 * Disable MFA for the authenticated user
 */
router.post('/disable', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    // If MFA is not enabled, don't allow disabling it
    if (!user.mfaEnabled) {
      return res.status(400).json({ error: 'MFA is not enabled for this account' });
    }
    
    // Disable MFA for the user
    await MFAService.disableMFA(user.id);
    
    return res.json({ disabled: true });
  } catch (error) {
    console.error('Error disabling MFA:', error);
    return res.status(500).json({ error: 'Failed to disable MFA' });
  }
});

/**
 * Verify an MFA token during login
 */
router.post('/verify-login', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { token } = req.body;
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    if (!user.mfaEnabled || !user.mfaSecret) {
      return res.status(400).json({ error: 'MFA is not enabled for this account' });
    }
    
    // Verify the token
    const isValid = MFAService.verifyToken(token, user.mfaSecret);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Mark the session as MFA verified
    if (req.session) {
      req.session.mfaVerified = true;
    }
    
    return res.json({ verified: true });
  } catch (error) {
    console.error('Error verifying MFA login token:', error);
    return res.status(500).json({ error: 'Failed to verify token' });
  }
});

/**
 * Verify a recovery code during login
 */
router.post('/recovery', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { recoveryCode } = req.body;
    
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    if (!recoveryCode) {
      return res.status(400).json({ error: 'Recovery code is required' });
    }
    
    // Verify the recovery code
    const isValid = await MFAService.verifyRecoveryCode(user.id, recoveryCode);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid recovery code' });
    }
    
    return res.json({ verified: true });
  } catch (error) {
    console.error('Error verifying recovery code:', error);
    return res.status(500).json({ error: 'Failed to verify recovery code' });
  }
});

export default router;