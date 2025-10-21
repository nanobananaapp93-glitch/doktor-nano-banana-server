import { NextResponse, NextRequest } from "next/server";
import clientPromise from '../../../lib/mongodb';
import { corsHeaders } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface WebhookEvent {
  api_version: string;
  event: {
    app_id: string;
    environment: string;
    event_timestamp_ms: number;
    id: string;
    store: string;
    subscriber_attributes: {
      $attConsentStatus: {
        updated_at_ms: number;
        value: string;
      };
    };
    transferred_from?: string[];
    transferred_to?: string[];
    type: string;
    app_user_id?: string;
    product_id?: string;
    expiration_at_ms?: number;
  };
}

async function updateUserSubscription(appUserId: string, productId: string, expirationAtMs: number) {
  const db = await (await clientPromise).db();
  const usersCollection = db.collection('users');

  let subscriptionType: 'weekly' | 'annual-promotional' | 'free' | 'annual' = 'free';
  let creditsToAdd = 0;

  // Determine subscription type and credits based on product_id
  if (productId.includes('007')) {
    subscriptionType = 'weekly';
    creditsToAdd = 25;
  } else if (productId.includes('365')) {
    subscriptionType = 'annual';
    creditsToAdd = 140;
  } else if (productId.includes('182')) {
    subscriptionType = 'annual-promotional';
    creditsToAdd = 85;
  }

  await usersCollection.updateOne(
    { deviceId: appUserId },
    {
      $set: {
        credits: creditsToAdd,
        updatedAt: new Date(),
        subscriptionStatus: subscriptionType,
        subscriptionExpiresAt: new Date(expirationAtMs),
        lastCreditUpdate: new Date()
      }
    },
    { upsert: true }
  );
}

async function updateUserExtraCredits(appUserId: string, productId: string) {
  const db = await (await clientPromise).db();
  const usersCollection = db.collection('users');

  let creditsToAdd = 0;

  // Determine extra credits based on product_id
  switch (productId) {
    case '100':
      creditsToAdd = 100;
      break;
    case '400':
      creditsToAdd = 400;
      break;
    case '100':
      creditsToAdd = 100;
      break;
    case '250':
      creditsToAdd = 250;
      break;
    case '500':
      creditsToAdd = 500;
      break;
    case '1000':
      creditsToAdd = 1000;
      break;
  }

  const currentUser = await usersCollection.findOne({ deviceId: appUserId });

  if (currentUser) {
    // Initialize extraCredits to 0 if it's null before incrementing
    await usersCollection.updateOne(
      { deviceId: appUserId },
      {
        $set: {
          extraCredits: (currentUser.extraCredits || 0) + creditsToAdd,
          updatedAt: new Date()
        }
      }
    );
  } else {
    // If the user document doesn't exist, create a new one with default values
    await usersCollection.insertOne({
      deviceId: appUserId,
      extraCredits: creditsToAdd,
      subscriptionStatus: 'free',
      credits: 0,
      updatedAt: new Date()
    });
  }
}

async function handleSubscriptionExpiration(appUserId: string) {
  const db = await (await clientPromise).db();
  const usersCollection = db.collection('users');

  await usersCollection.updateOne(
    { deviceId: appUserId },
    {
      $set: {
        subscriptionStatus: 'free',
        subscriptionExpiresAt: null,
        updatedAt: new Date(),
        credits: 0 // Only reset subscription credits, keep extraCredits unchanged
      }
    }
  );
}

async function handleSubscriptionTransfer(transferredFrom: string, transferredTo: string) {
  const db = await (await clientPromise).db();
  const usersCollection = db.collection('users');

  const originalUser = await usersCollection.findOne({ deviceId: transferredFrom });

  if (originalUser) {
    await usersCollection.updateOne(
      { deviceId: transferredTo },
      {
        $set: {
          credits: originalUser.credits,
          extraCredits: originalUser.extraCredits, // Transfer extra credits too
          subscriptionStatus: originalUser.subscriptionStatus,
          subscriptionExpiresAt: originalUser.subscriptionExpiresAt,
          updatedAt: new Date(),
          transferredFrom: transferredFrom
        }
      },
      { upsert: true }
    );

    await usersCollection.updateOne(
      { deviceId: transferredFrom },
      {
        $set: {
          transferredTo: transferredTo
        }
      }
    );
  }
}

export async function POST(req: NextRequest) {
  if (req.method === 'POST') {
    try {
      const body: WebhookEvent = await req.json();
      const { event } = body;

      if (!event) {
        return new NextResponse(JSON.stringify({ error: 'Invalid webhook payload' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // Handle different event types
      switch (event.type) {
        case 'INITIAL_PURCHASE':
        case 'RENEWAL':
        case 'TEST':
          if (event.app_user_id && event.product_id && event.expiration_at_ms) {
            await updateUserSubscription(event.app_user_id, event.product_id, event.expiration_at_ms);
          } else {
            console.log('Missing information for purchase/renewal event');
          }
          break;
        case 'NON_RENEWING_PURCHASE':
          if (event.app_user_id && event.product_id) {
            await updateUserExtraCredits(event.app_user_id, event.product_id);
          } else {
            console.log('Missing information for non-renewing purchase event');
          }
          break;
        case 'EXPIRATION':
          if (event.app_user_id) {
            await handleSubscriptionExpiration(event.app_user_id);
          } else {
            console.log('Missing app_user_id for expiration event');
          }
          break;
        case 'TRANSFER':
          if (event.transferred_from && event.transferred_to && 
              event.transferred_from.length > 0 && event.transferred_to.length > 0) {
            await handleSubscriptionTransfer(event.transferred_from[0], event.transferred_to[0]);
          } else {
            console.log('Missing information for transfer event');
          }
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return new NextResponse(JSON.stringify({ message: 'Webhook processed successfully' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error: any) {
      console.error('Error processing webhook:', error.message);
      return new NextResponse(JSON.stringify({ error: 'Internal server error' }), {
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
        Allow: 'POST',
        ...corsHeaders
      },
      status: 405
    });
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
}