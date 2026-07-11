// HMAC-signed pair tokens. A token encodes which two entrants were served,
// when, and a random nonce, so /api/vote can verify the pairing was issued by
// the server and has not been tampered with. Uses Web Crypto only, so the
// same module runs in Cloudflare Workers and in Node (>=18) for tests.

const encoder = new TextEncoder();

function bytesToBase64Url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(str) {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function hmacSign(secret, message) {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return new Uint8Array(sig);
}

function timingSafeEqualBytes(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function randomNonce() {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}

/**
 * Create a signed pair token.
 * payload fields: t (track), a (dir shown in slot A), b (dir shown in slot B),
 * iat (unix seconds), n (nonce, makes each issued token unique).
 * Returns the token string: base64url(payload_json) + "." + base64url(hmac).
 */
export async function signPairToken(secret, { track, aDir, bDir, issuedAt }) {
  const payload = { t: track, a: aDir, b: bDir, iat: issuedAt, n: randomNonce() };
  const body = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = bytesToBase64Url(await hmacSign(secret, body));
  return `${body}.${sig}`;
}

/**
 * Verify a pair token. Returns the decoded payload
 * { track, aDir, bDir, issuedAt, nonce } on success, or null on any failure
 * (bad format, bad signature, malformed payload).
 */
export async function verifyPairToken(secret, token) {
  if (typeof token !== "string" || token.length > 2048) return null;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [body, sig] = parts;
  if (!/^[A-Za-z0-9_-]+$/.test(body) || !/^[A-Za-z0-9_-]+$/.test(sig)) return null;

  let expected;
  try {
    expected = await hmacSign(secret, body);
  } catch {
    return null;
  }
  let given;
  try {
    given = base64UrlToBytes(sig);
  } catch {
    return null;
  }
  if (!timingSafeEqualBytes(expected, given)) return null;

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(body)));
  } catch {
    return null;
  }
  if (
    !payload || typeof payload !== "object" ||
    typeof payload.t !== "string" || typeof payload.a !== "string" ||
    typeof payload.b !== "string" || !Number.isFinite(payload.iat) ||
    typeof payload.n !== "string"
  ) {
    return null;
  }
  return {
    track: payload.t,
    aDir: payload.a,
    bDir: payload.b,
    issuedAt: payload.iat,
    nonce: payload.n,
  };
}

/** SHA-256 hex digest of a string. Used for voter_hash. */
export async function sha256Hex(input) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
