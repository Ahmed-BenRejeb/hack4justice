/**
 * Thin pass-through from the browser to the backend's /api/v1 surface (docs/architecture.md section 5).
 *
 * No business logic lives here: method, path, query string, body and content type are
 * forwarded unchanged, and the backend's status and body come back unchanged.
 */
import type { NextRequest } from "next/server";
import { getApiBaseUrl } from "@/lib/env";

/** Request headers worth forwarding. Cookies and hop-by-hop headers stay on the browser side. */
const FORWARDED_REQUEST_HEADERS = ["content-type", "accept"];

async function forward(
  request: NextRequest,
  context: RouteContext<"/api/v1/[...path]">,
): Promise<Response> {
  let baseUrl: string;
  try {
    baseUrl = getApiBaseUrl();
  } catch (error) {
    // Configuration errors name the variable, never its value, so they are safe to return.
    return Response.json({ detail: (error as Error).message }, { status: 500 });
  }

  const { path } = await context.params;
  const target = `${baseUrl}/api/v1/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      // Buffered rather than streamed: payment files are small, and this avoids half-duplex stream setup.
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });
  } catch {
    return Response.json({ detail: "Backend unreachable" }, { status: 502 });
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) responseHeaders.set("content-type", contentType);
  return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
