import { NextResponse, NextRequest } from "next/server";
import { corsHeaders } from "@/lib/utils";
import clientPromise from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export const dynamic = "force-dynamic";

const PHOTO_GENERATION_COST = 1;

async function refundUserCredit(deviceId: string): Promise<void> {
  const db = await (await clientPromise).db();
  const usersCollection = db.collection('users');

  await usersCollection.updateOne(
    { deviceId: deviceId },
    {
      $inc: {
        credits: PHOTO_GENERATION_COST,
        totalCreditsSpent: -PHOTO_GENERATION_COST
      },
      $set: { updatedAt: new Date() }
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get('requestId');

    if (!requestId || !ObjectId.isValid(requestId)) {
      console.error('Webhook received without valid requestId:', requestId);
      return new NextResponse(JSON.stringify({ error: 'Invalid requestId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json().catch(() => null);

    if (!body) {
      console.error('Webhook received empty body for requestId:', requestId);
      return new NextResponse(JSON.stringify({ error: 'Empty body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = await (await clientPromise).db();
    const photosCollection = db.collection('photos');

    // Find the existing record
    const existingRecord = await photosCollection.findOne({ _id: new ObjectId(requestId) });

    if (!existingRecord) {
      console.error('Webhook: Record not found for requestId:', requestId);
      return new NextResponse(JSON.stringify({ error: 'Record not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if already processed (idempotency)
    if (existingRecord.status === 'completed' || existingRecord.status === 'failed') {
      console.log('Webhook: Record already processed for requestId:', requestId);
      return new NextResponse(JSON.stringify({ message: 'Already processed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // fal.ai webhook payload structure:
    // Success: { status: "OK", payload: { images: [...], ... }, request_id: "..." }
    // Error: { status: "ERROR", error: "...", request_id: "..." }
    const falStatus = body.status;
    const payload = body.payload;
    const errorMessage = body.error;

    if (falStatus === 'OK' && payload) {
      // Success - update record with images
      await photosCollection.updateOne(
        { _id: new ObjectId(requestId) },
        {
          $set: {
            status: 'completed',
            images: payload.images || [],
            description: payload.description || null,
            completedAt: new Date(),
            updatedAt: new Date(),
          }
        }
      );

      console.log('Webhook: Successfully completed requestId:', requestId);

      return new NextResponse(JSON.stringify({ message: 'Success' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      // Failure - update record and refund credits
      await photosCollection.updateOne(
        { _id: new ObjectId(requestId) },
        {
          $set: {
            status: 'failed',
            error: errorMessage || 'Image generation failed',
            updatedAt: new Date(),
          }
        }
      );

      // Refund the user's credits
      if (existingRecord.deviceId) {
        await refundUserCredit(existingRecord.deviceId);
        console.log('Webhook: Refunded credits for deviceId:', existingRecord.deviceId);
      }

      console.log('Webhook: Failed requestId:', requestId, 'Error:', errorMessage);

      return new NextResponse(JSON.stringify({ message: 'Failure recorded' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error: any) {
    console.error('Webhook error:', error);

    return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Also handle GET for testing/verification
export async function GET(req: NextRequest) {
  return new NextResponse(JSON.stringify({ message: 'Webhook endpoint is active' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}
