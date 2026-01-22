import { NextResponse, NextRequest } from "next/server";
import { corsHeaders } from "@/lib/utils";
import clientPromise from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { fal } from "@fal-ai/client";

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

    // If still processing and we have a falRequestId, check fal.ai directly
    if (photo.status === 'processing' && photo.falRequestId) {
      try {
        const falStatus = await fal.queue.status("fal-ai/nano-banana/edit", {
          requestId: photo.falRequestId,
          logs: false,
        });

        const statusStr = falStatus.status as string;
        console.log('Fal.ai status check:', { requestId, falRequestId: photo.falRequestId, falStatus: statusStr });

        if (statusStr === 'COMPLETED') {
          // Fetch the result
          const falResult = await fal.queue.result("fal-ai/nano-banana/edit", {
            requestId: photo.falRequestId,
          });

          const resultData = falResult.data as any;

          // Update our database with the result
          await photosCollection.updateOne(
            { _id: new ObjectId(requestId) },
            {
              $set: {
                status: 'completed',
                images: resultData?.images || [],
                description: resultData?.description || null,
                completedAt: new Date(),
                updatedAt: new Date(),
              }
            }
          );

          console.log('Status poll: Completed requestId:', requestId);

          return new NextResponse(JSON.stringify({
            requestId,
            status: 'completed',
            images: resultData?.images || [],
            description: resultData?.description || null,
            style: photo.style,
            createdAt: photo.createdAt,
            completedAt: new Date(),
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        if (statusStr === 'FAILED') {
          const errorMsg = 'Image generation failed';

          // Update our database
          await photosCollection.updateOne(
            { _id: new ObjectId(requestId) },
            {
              $set: {
                status: 'failed',
                error: errorMsg,
                updatedAt: new Date(),
              }
            }
          );

          // Refund credits
          if (photo.deviceId) {
            await refundUserCredit(photo.deviceId);
            console.log('Status poll: Refunded credits for deviceId:', photo.deviceId);
          }

          console.log('Status poll: Failed requestId:', requestId);

          return new NextResponse(JSON.stringify({
            requestId,
            status: 'failed',
            error: errorMsg,
            createdAt: photo.createdAt,
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          });
        }

        // Still processing (IN_QUEUE or IN_PROGRESS)
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

      } catch (falError: any) {
        console.error('Error checking fal.ai status:', falError);
        // Fall through to return processing status
      }
    }

    // Return processing status (fallback or no falRequestId yet)
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
