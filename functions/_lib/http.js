// Small helpers for JSON responses and defensive request parsing.

const BASE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...BASE_HEADERS, ...extraHeaders },
  });
}

export function errorResponse(code, message, status) {
  return jsonResponse({ error: { code, message } }, status);
}

/**
 * Parse a JSON request body defensively.
 * Returns a plain object, or null if the body is missing, oversized,
 * malformed, or not a JSON object.
 */
export async function readJsonBody(request, maxBytes = 4096) {
  let text;
  try {
    text = await request.text();
  } catch {
    return null;
  }
  if (!text || text.length > maxBytes) return null;
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  return data;
}
