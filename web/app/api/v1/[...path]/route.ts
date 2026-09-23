import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URLS = [
  process.env.BACKEND_URL,
  process.env.API_URL,
  process.env.BACKEND_PORT ? `http://127.0.0.1:${process.env.BACKEND_PORT}` : null,
  'http://127.0.0.1:3009',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080',
  'http://localhost:3000',
  'http://localhost:3009',
].filter(Boolean) as string[];

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const params = await context.params;
  const subPath = (params.path || []).join('/');
  const search = request.nextUrl.search || '';

  let body: ArrayBuffer | undefined = undefined;
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    try {
      body = await request.arrayBuffer();
    } catch {
      body = undefined;
    }
  }

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');

  const uniqueUrls = Array.from(new Set(BACKEND_URLS.map(u => u.replace(/\/$/, ''))));

  for (const baseUrl of uniqueUrls) {
    const fullTarget = baseUrl.endsWith('/api/v1')
      ? `${baseUrl}/${subPath}${search}`
      : `${baseUrl}/api/v1/${subPath}${search}`;

    try {
      const backendRes = await fetch(fullTarget, {
        method: request.method,
        headers,
        body: body && body.byteLength > 0 ? body : undefined,
        redirect: 'manual',
        signal: AbortSignal.timeout(10000),
      });

      const resHeaders = new Headers(backendRes.headers);

      return new NextResponse(backendRes.body, {
        status: backendRes.status,
        statusText: backendRes.statusText,
        headers: resHeaders,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[API Proxy Target ${fullTarget} Failed]: ${errorMsg}`);
    }
  }

  console.error(`[API Proxy Error] All backend targets failed for /api/v1/${subPath}`);

  return NextResponse.json(
    {
      success: false,
      data: null,
      message: 'Không thể kết nối máy chủ backend. Vui lòng thử lại sau giây lát.',
      errorCode: 'BACKEND_UNREACHABLE',
    },
    { status: 503 }
  );
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const HEAD = proxyRequest;
export const OPTIONS = proxyRequest;
