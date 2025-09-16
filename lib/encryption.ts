import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

/**
 * Get encryption key from environment variable
 * In production, use a proper key management service
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }

  // If key is hex string, convert to buffer
  if (key.length === 64) {
    return Buffer.from(key, "hex");
  }

  // Otherwise, derive key from string using PBKDF2
  return crypto.pbkdf2Sync(
    key,
    "github-pat-salt",
    100000,
    KEY_LENGTH,
    "sha256"
  );
}

/**
 * Encrypt a PAT token
 */
export function encryptToken(token: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, key);

    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");

    // For GCM mode, we need to get the auth tag
    const tag = cipher.getAuthTag();

    // Combine IV + tag + encrypted data
    const combined = Buffer.concat([iv, tag, Buffer.from(encrypted, "hex")]);
    return combined.toString("base64");
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt token");
  }
}

/**
 * Decrypt a PAT token
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedToken, "base64");

    // Extract IV, tag, and encrypted data
    const iv = combined.subarray(0, IV_LENGTH); // eslint-disable-line @typescript-eslint/no-unused-vars
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt token");
  }
}

/**
 * Generate a random encryption key (for initial setup)
 * Run this once to generate your ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
}
