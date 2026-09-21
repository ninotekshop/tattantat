import { NextRequest, NextResponse } from 'next/server';

const BACKEND_PORTS = [
  process.env.BACKEND_PORT || '3009',
  '3009',
  '3000',
  '8080',
];

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

  const triedPorts: string[] = [];
  const uniquePorts = Array.from(new Set(BACKEND_PORTS));

  for (const port of uniquePorts) {
    triedPorts.push(port);
    const backendUrl = `http://127.0.0.1:${port}/api/v1/${subPath}${search}`;

    try {
      const backendRes = await fetch(backendUrl, {
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
      console.warn(`[API Proxy Port ${port} Failed] /api/v1/${subPath}: ${errorMsg}`);
    }
  }

  console.error(`[API Proxy Error] All backend ports (${triedPorts.join(', ')}) failed for /api/v1/${subPath}`);

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
