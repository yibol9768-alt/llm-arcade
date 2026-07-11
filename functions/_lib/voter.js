import { sha256Hex } from "./hmac.js";

/** Stable, server-side pseudonymous visitor id. Raw IP and UA are never stored. */
export async function getVoterHash(request, salt) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown-ip";
  const ua = request.headers.get("User-Agent") || "unknown-ua";
  return sha256Hex(`${ip}|${ua}|${salt}`);
}
