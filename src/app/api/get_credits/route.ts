import { NextResponse, NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { corsHeaders } from "@/lib/utils";

// Function to fetch user credits from the database
async function getUserCredits(deviceId: string) {
  // Validate deviceId format (UUID format)
  if (!deviceId || deviceId.trim() === '') {
    console.warn('[get_credits] Invalid deviceId format', { deviceId });
    throw new Error('Invalid deviceId format');
  }

  const db = await (await clientPromise).db();
  const usersCollection = db.collection('users');

  const user = await usersCollection.findOne({ deviceId: deviceId });
  if (!user) {
    console.warn('[get_credits] User not found', { deviceId });
    throw new Error('User not found');
  } else {
    // Handle case where extraCredits field doesn't exist (legacy users)
    const subscriptionCredits = user.credits || 0;
    const extraCredits = user.extraCredits || 0;
    
    return { subscriptionCredits, extraCredits };
  }
}

// API Route
export async function GET(req: NextRequest) {
  if (req.method === 'GET') {
    try {
      const { searchParams } = new URL(req.url);
      const deviceId = searchParams.get('deviceId');

      if (!deviceId) {
        return new NextResponse(JSON.stringify({ error: 'deviceId is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const { subscriptionCredits, extraCredits } = await getUserCredits(deviceId);

      return new NextResponse(JSON.stringify({ credits: subscriptionCredits, extraCredits }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    } catch (error: any) {
      // Add structured error logging with context
      try {
        const { searchParams } = new URL(req.url);
        const deviceIdFromUrl = searchParams.get('deviceId');
        console.error('[get_credits] Error fetching user credits', {
          deviceId: deviceIdFromUrl,
          method: req.method,
          url: req.url,
          errorName: error?.name,
          errorMessage: error?.message,
          stack: error?.stack ? String(error.stack).split('\n').slice(0, 3).join('\n') : undefined,
        });
      } catch {
        console.error('[get_credits] Error fetching user credits (failed to parse context)', error);
      }

      // Don't expose internal error details to client
      return new NextResponse(JSON.stringify({ error: 'An error occurred while processing your request' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  } else {
    return new NextResponse('Method Not Allowed', {
      headers: {
        Allow: 'GET',
        ...corsHeaders
      },
      status: 405
    });
  }
}