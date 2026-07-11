import { jsonResponse } from "../_lib/http.js";

export function onRequestGet() {
  return jsonResponse({ ok: true, ts: Math.floor(Date.now() / 1000) });
}
