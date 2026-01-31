// app/api/audio/[filename]/route.ts
// Proxy R2 audio files without needing public bucket access

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Fetch from R2 using the public URL
    const r2Url = `${process.env.R2_PUBLIC_URL}/elevenlabs/${filename}`;

    // For now, try the public URL (we know files are uploaded)
    // If this fails, we'll need to use S3-compatible API with credentials
    const response = await fetch(r2Url);

    if (!response.ok) {
      // Fallback: Use Wrangler or implement S3-compatible fetch
      return NextResponse.json(
        { error: 'Audio file not found' },
        { status: 404 }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving audio:', error);
    return NextResponse.json(
      { error: 'Failed to serve audio' },
      { status: 500 }
    );
  }
}
