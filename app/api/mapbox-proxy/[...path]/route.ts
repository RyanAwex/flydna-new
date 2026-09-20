import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const pathStr = Array.isArray(path) ? path.join("/") : (path || "");
    const search = request.nextUrl.search || "";
    const targetUrl = `https://api.mapbox.com/${pathStr}${search}`;

    const res = await fetch(targetUrl, {
      headers: {
        Referer: "https://staging.flydna.io",
        Origin: "https://staging.flydna.io",
      },
    });

    const responseHeaders = new Headers();
    const contentType = res.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);
    const cacheControl = res.headers.get("cache-control");
    if (cacheControl) responseHeaders.set("cache-control", cacheControl);
    else responseHeaders.set("cache-control", "public, max-age=86400, stale-while-revalidate=604800");

    const data = await res.arrayBuffer();
    return new NextResponse(data, {
      status: res.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Mapbox proxy error" }, { status: 500 });
  }
}
