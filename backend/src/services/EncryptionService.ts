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
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot decrypt undefined or empty text');
  }
  
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is not set');
  }
  
  const [ivHex, encrypted] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secret, 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Create a default export object for easier importing
const EncryptionService = {
  encrypt,
  decrypt
};

export default EncryptionService;