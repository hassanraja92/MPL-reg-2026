// JWT-like token utilities and password hashing using Web Crypto API

function enc(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function b64url(s: string): string {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function unb64url(s: string): string {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  return atob(pad ? padded + "=".repeat(4 - pad) : padded);
}

async function hmacKey(secret: string, usages: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages
  );
}

function hexBytes(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function pbkdf2Bits(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey("raw", enc(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256
  );
}

export async function signToken(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const key = await hmacKey(secret, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc(data));
  return `${data}.${b64url(String.fromCharCode(...new Uint8Array(sig)))}`;
}

export async function verifyToken(token: string, secret: string): Promise<Record<string, unknown>> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");
  const [header, body, sigB64] = parts;
  const data = `${header}.${body}`;
  const key = await hmacKey(secret, ["verify"]);
  const sig = Uint8Array.from(unb64url(sigB64), (c) => c.charCodeAt(0));
  const valid = await crypto.subtle.verify("HMAC", key, sig, enc(data));
  if (!valid) throw new Error("Invalid signature");
  const payload = JSON.parse(unb64url(body)) as Record<string, unknown>;
  if (typeof payload.exp === "number" && payload.exp < Date.now()) throw new Error("Token expired");
  return payload;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await pbkdf2Bits(password, salt);
  return `${hexBytes(salt)}:${hexBytes(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const colonIdx = stored.indexOf(":");
    if (colonIdx === -1) return false;
    const saltHex = stored.slice(0, colonIdx);
    const expectedHex = stored.slice(colonIdx + 1);
    const salt = Uint8Array.from((saltHex.match(/.{2}/g) ?? []).map((h) => parseInt(h, 16)));
    const bits = await pbkdf2Bits(password, salt);
    return hexBytes(new Uint8Array(bits)) === expectedHex;
  } catch {
    return false;
  }
}

export async function getAuthUser(
  req: Request,
  secret: string
): Promise<{ username: string; id: number } | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  try {
    const payload = await verifyToken(token, secret);
    return payload as { username: string; id: number };
  } catch {
    return null;
  }
}
