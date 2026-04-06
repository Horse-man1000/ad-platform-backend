import crypto from "crypto";

function getKey() {
  const raw = process.env.ENCRYPTION_KEY || "";
  return Buffer.from(raw.padEnd(32, "0").slice(0, 32));
}

export function encrypt(text) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is required for token encryption");
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(encryptedText) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is required for token decryption");
  }
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format");
  }
  const [ivHex, authTagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(authTag);
  return decipher.update(data, undefined, "utf8") + decipher.final("utf8");
}

export function generateState(clientId) {
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = JSON.stringify({ clientId, nonce });
  return Buffer.from(payload).toString("base64url");
}

export function parseState(state) {
  try {
    const payload = Buffer.from(state, "base64url").toString("utf8");
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export function buildAuthURL(provider, params) {
  const bases = {
    google: "https://accounts.google.com/o/oauth2/v2/auth",
    meta: "https://www.facebook.com/v21.0/dialog/oauth",
  };
  const base = bases[provider];
  if (!base) {
    throw new Error(`Unknown OAuth provider: ${provider}`);
  }
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}

export function parseCallbackParams(query) {
  return {
    code: query?.code || null,
    state: query?.state || null,
    error: query?.error || null,
    errorDescription: query?.error_description || null,
  };
}
