import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secret = process.env.ENCRYPTION_SECRET;

export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt undefined or empty text');
  }

  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is not set');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secret, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot decrypt undefined or empty text');
  }

  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is not set');
  }

  try {
    const parts = text.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secret, 'hex'), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const EncryptionService = {
  encrypt,
  decrypt
};

export default EncryptionService;