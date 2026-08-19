import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const TOKEN_ALGORITHM = "aes-256-gcm";
const TOKEN_IV_BYTES = 12;

export type EncryptedInstagramToken = {
  ciphertext: string;
  iv: string;
  authTag: string;
};

function getEncryptionKey() {
  const encodedKey = process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY?.trim();
  if (!encodedKey) {
    return null;
  }

  const key = Buffer.from(encodedKey, "base64");
  return key.length === 32 ? key : null;
}

export function isInstagramTokenEncryptionConfigured() {
  return Boolean(getEncryptionKey());
}

function tokenAad(appId: string, userId: string) {
  return Buffer.from(`arena-sul-instagram-token:v1:${appId}:${userId}`, "utf8");
}

export function encryptInstagramToken({
  token,
  appId,
  userId,
}: {
  token: string;
  appId: string;
  userId: string;
}): EncryptedInstagramToken {
  const key = getEncryptionKey();
  if (!key) {
    throw new Error("Instagram token encryption is not configured");
  }

  const iv = randomBytes(TOKEN_IV_BYTES);
  const cipher = createCipheriv(TOKEN_ALGORITHM, key, iv);
  cipher.setAAD(tokenAad(appId, userId));

  const ciphertext = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptInstagramToken({
  encrypted,
  appId,
  userId,
}: {
  encrypted: EncryptedInstagramToken;
  appId: string;
  userId: string;
}) {
  const key = getEncryptionKey();
  if (!key) {
    throw new Error("Instagram token encryption is not configured");
  }

  const decipher = createDecipheriv(
    TOKEN_ALGORITHM,
    key,
    Buffer.from(encrypted.iv, "base64"),
  );
  decipher.setAAD(tokenAad(appId, userId));
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function randomOAuthSecret() {
  return randomBytes(32).toString("base64url");
}

export function hashOAuthSecret(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function secretsMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
