import { r2, R2_BUCKET_NAME } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';

/**
 * R2 File Proxy
 * -------------
 * Proxies requests to Cloudflare R2 to standard Next.js response.
 * Solves CORS issues by serving files from the same domain.
 * Usage: /api/file/uploads/filename.png
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const key = path.join('/');

    if (!key) {
      return new NextResponse('Missing file key', { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    const file = await r2.send(command);

    if (!file.Body) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Convert payload to web stream
    const stream = file.Body.transformToWebStream();

    const headers = new Headers();
    headers.set('Content-Type', file.ContentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(stream, { headers });
  } catch (error) {
    console.error('R2 Proxy Error:', error);
    return new NextResponse('File not found', { status: 404 });
  }
}
