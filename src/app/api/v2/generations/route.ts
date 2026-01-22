import { NextResponse, NextRequest } from "next/server";
import { corsHeaders } from "@/lib/utils";
import clientPromise from '../../../../lib/mongodb';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status'); // Optional filter: 'processing', 'completed', 'failed'

    if (!deviceId) {
      return new NextResponse(JSON.stringify({ error: 'deviceId is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }

    const db = await (await clientPromise).db();
    const photosCollection = db.collection('photos');

    // Build query
    const query: any = { deviceId };
    if (status && ['processing', 'completed', 'failed'].includes(status)) {
      query.status = status;
    }

    // Get total count for pagination
    const total = await photosCollection.countDocuments(query);

    // Fetch generations with pagination, newest first
    const generations = await photosCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .project({
        _id: 1,
        status: 1,
        images: 1,
        description: 1,
        style: 1,
        prompt: 1,
        error: 1,
        createdAt: 1,
        completedAt: 1,
      })
      .toArray();

    // Transform _id to requestId for consistency
    const transformedGenerations = generations.map(gen => ({
      requestId: gen._id.toString(),
      status: gen.status,
      images: gen.images,
      description: gen.description,
      style: gen.style,
      prompt: gen.prompt,
      error: gen.error,
      createdAt: gen.createdAt,
      completedAt: gen.completedAt,
    }));

    return new NextResponse(JSON.stringify({
      generations: transformedGenerations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + generations.length < total,
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error: any) {
    console.error('Generations list error:', error);

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
