/**
 * FlyDnA End-to-End Encryption (E2EE) Utility Module
 * Powered by Web Crypto API (AES-256-GCM)
 */

const DEFAULT_SECRET = "flydna_e2ee_master_shield_key_v1";

// Helper: Convert ArrayBuffer to Hex string
function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Helper: Convert Hex string to Uint8Array
function hexToBuf(hexStr: string): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(hexStr.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexStr.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Helper: Derive a 256-bit CryptoKey from string secret using SHA-256
async function deriveAesKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const secretBuf = enc.encode(secret);
  const hashBuf = await window.crypto.subtle.digest("SHA-256", secretBuf);
  return window.crypto.subtle.importKey(
    "raw",
    hashBuf,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Checks if a string is in E2EE ciphertext format (ENC:iv:ciphertext)
 */
export function isEncryptedPayload(text: string): boolean {
  return typeof text === "string" && text.startsWith("ENC:");
}

/**
 * Encrypts a plaintext message into E2EE ciphertext format using AES-256-GCM.
 * Format: ENC:<12_byte_iv_hex>:<ciphertext_hex>
 */
export async function encryptMessage(plaintext: string, customSecret?: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    return plaintext; // Fallback for non-browser environment
  }

  try {
    const key = await deriveAesKey(customSecret || DEFAULT_SECRET);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12-byte IV for AES-GCM
    const enc = new TextEncoder();
    const encodedText = enc.encode(plaintext);

    const ciphertextBuf = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encodedText
    );

    const ivHex = bufToHex(iv.buffer as ArrayBuffer);
    const cipherHex = bufToHex(ciphertextBuf);

    return `ENC:${ivHex}:${cipherHex}`;
  } catch (err) {
    console.error("[E2EE] Encryption failed, sending plaintext fallback:", err);
    return plaintext;
  }
}

/**
 * Decrypts an E2EE ciphertext string (ENC:iv:ciphertext) back into plaintext.
 * Returns original text if string is not encrypted.
 */
export async function decryptMessage(payload: string, customSecret?: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto || !window.crypto.subtle) {
    return payload;
  }

  if (!isEncryptedPayload(payload)) {
    return payload; // Legacy unencrypted message pass-through
  }

  try {
    const parts = payload.split(":");
    if (parts.length !== 3) return payload;

    const ivHex = parts[1];
    const cipherHex = parts[2];

    const iv = hexToBuf(ivHex);
    const ciphertext = hexToBuf(cipherHex);

    const key = await deriveAesKey(customSecret || DEFAULT_SECRET);

    const decryptedBuf = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
      key,
      ciphertext.buffer as ArrayBuffer
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuf);
  } catch (err) {
    console.warn("[E2EE] Decryption pass-through (key mismatch or corrupt):", err);
    return payload;
  }
}
