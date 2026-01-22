import { NextResponse, NextRequest } from "next/server";
import { corsHeaders } from "@/lib/utils";
import clientPromise from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');
    const deviceId = searchParams.get('deviceId');

    if (!requestId) {
      return new NextResponse(JSON.stringify({ error: 'requestId is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(requestId)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid requestId format' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const db = await (await clientPromise).db();
    const photosCollection = db.collection('photos');

    // Build query - optionally filter by deviceId for security
    const query: any = { _id: new ObjectId(requestId) };
    if (deviceId) {
      query.deviceId = deviceId;
    }

    const photo = await photosCollection.findOne(query);

    if (!photo) {
      return new NextResponse(JSON.stringify({ error: 'Generation not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Return different response based on status
    if (photo.status === 'processing') {
      return new NextResponse(JSON.stringify({
        requestId,
        status: 'processing',
        createdAt: photo.createdAt,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (photo.status === 'completed') {
      return new NextResponse(JSON.stringify({
        requestId,
        status: 'completed',
        images: photo.images,
        description: photo.description,
        style: photo.style,
        createdAt: photo.createdAt,
        completedAt: photo.completedAt,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    if (photo.status === 'failed') {
      return new NextResponse(JSON.stringify({
        requestId,
        status: 'failed',
        error: photo.error || 'Generation failed',
        createdAt: photo.createdAt,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    // Unknown status - treat as processing
    return new NextResponse(JSON.stringify({
      requestId,
      status: photo.status || 'unknown',
      createdAt: photo.createdAt,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error: any) {
    console.error('Status check error:', error);

    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}
