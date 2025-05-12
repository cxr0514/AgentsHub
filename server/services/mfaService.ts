import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import { User } from '@shared/schema';
import { storage } from '../storage';
import QRCode from 'qrcode';

// Service to handle multi-factor authentication functionality
export class MFAService {
  private static readonly MFA_SECRET_LENGTH = 20;
  private static readonly APP_NAME = 'RealEstatePro';

  /**
   * Generate a new MFA secret for a user
   * @param user The user to generate a secret for
   * @returns The generated secret and QR code
   */
  static async generateSecret(user: User): Promise<{ secret: string; qrCode: string }> {
    // Generate a random secret
    const secret = authenticator.generateSecret(this.MFA_SECRET_LENGTH);
    
    // Generate the QR code URL
    const otpauth = authenticator.keyuri(
      user.email || user.username,
      this.APP_NAME,
      secret
    );

    // Create QR code as a data URL
    const qrCode = await QRCode.toDataURL(otpauth);

    return { secret, qrCode };
  }

  /**
   * Verify a token against a user's MFA secret
   * @param token The token to verify
   * @param secret The user's MFA secret
   * @returns Whether the token is valid
   */
  static verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      console.error('Error verifying MFA token:', error);
      return false;
    }
  }

  /**
   * Generate a set of recovery codes for a user
   * @returns Array of recovery codes
   */
  static generateRecoveryCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const buffer = crypto.randomBytes(10);
      // Format as 4 chunks of 5 characters
      const code = buffer.toString('hex').substring(0, 20)
        .match(/.{1,5}/g)
        ?.join('-') || '';
      codes.push(code);
    }
    return codes;
  }

  /**
   * Enable MFA for a user
   * @param userId The user's ID
   * @param secret The MFA secret
   * @param recoveryCodes The generated recovery codes
   */
  static async enableMFA(userId: number, secret: string, recoveryCodes: string[]): Promise<void> {
    // Hash recovery codes before storing them
    const hashedRecoveryCodes = recoveryCodes.map(code => 
      crypto.createHash('sha256').update(code).digest('hex')
    );

    // Store the secret and recovery codes (update user with MFA data)
    await storage.updateUser(userId, {
      mfaEnabled: true,
      mfaSecret: secret,
      mfaRecoveryCodes: hashedRecoveryCodes
    });
  }

  /**
   * Disable MFA for a user
   * @param userId The user's ID
   */
  static async disableMFA(userId: number): Promise<void> {
    await storage.updateUser(userId, {
      mfaEnabled: false,
      mfaSecret: null,
      mfaRecoveryCodes: null
    });
  }

  /**
   * Verify a recovery code
   * @param userId The user's ID
   * @param recoveryCode The recovery code to verify
   * @returns Whether the recovery code is valid
   */
  static async verifyRecoveryCode(userId: number, recoveryCode: string): Promise<boolean> {
    const user = await storage.getUser(userId);
    if (!user || !user.mfaRecoveryCodes) {
      return false;
    }

    // Hash the provided recovery code
    const hashedCode = crypto.createHash('sha256').update(recoveryCode).digest('hex');
    
    // Check if the hashed code exists in the user's recovery codes
    const index = user.mfaRecoveryCodes.indexOf(hashedCode);
    if (index === -1) {
      return false;
    }

    // Remove the used recovery code
    const updatedCodes = [...user.mfaRecoveryCodes];
    updatedCodes.splice(index, 1);
    
    // Update the user's recovery codes
    await storage.updateUser(userId, {
      mfaRecoveryCodes: updatedCodes
    });

    return true;
  }
}

export default MFAService;