import { NextResponse, NextRequest } from "next/server";
import { corsHeaders } from "@/lib/utils";
import clientPromise from '../../../lib/mongodb';

export const dynamic = "force-dynamic";

interface DeviceInfoRequest {
  deviceId: string;
  deviceModel: string;
  osVersion: string;
  language: string;
  locale: string;
  appVersion: string;
  latestUsedTime: string;
  timeZone: string;
  initialCredits?: number;
}

async function updateOrCreateUserInfo(deviceInfo: DeviceInfoRequest): Promise<{ status: 'created'; shouldStart: boolean } | { status: 'updated' }> {
  const db = await (await clientPromise).db();
  const usersCollection = db.collection('users');


  // Except 'ES','FR','IS','IE'
  const europeanCountryCodes = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'DE', 'GR', 'HU', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'SE', 'GB', 'NO', 'CH', 'LI'];

  const localeUpper = deviceInfo.locale?.toUpperCase() ?? '';
  const isUS = localeUpper.includes('US');
  const isEU = europeanCountryCodes.some(code => localeUpper.includes(code));

  let shouldStart = Math.random() < 1.35;
  // var shouldStart = false;
  // if (isUS) {
  //   shouldStart = false;
  // } else if (isEU) {
  //   shouldStart = Math.random() < 0.4;
  // } else {
  //   shouldStart = Math.random() < 0;
  // }

  const initialCredits = shouldStart ? 2 : 1;

  const updateResult = await usersCollection.updateOne(
    { deviceId: deviceInfo.deviceId },
    {
      $set: {
        deviceModel: deviceInfo.deviceModel,
        osVersion: deviceInfo.osVersion,
        language: deviceInfo.language,
        locale: deviceInfo.locale,
        appVersion: deviceInfo.appVersion,
        latestUsedTime: deviceInfo.latestUsedTime,
        timeZone: deviceInfo.timeZone,
        updatedAt: new Date()
      },
      $setOnInsert: {
        credits: initialCredits,
        extraCredits: 0,
        createdAt: new Date(),
        subscriptionStatus: 'free',
        shouldStart: shouldStart
      }
    },
    { upsert: true }
  );

  if (updateResult.upsertedId) {
    return { status: 'created', shouldStart };
  }
  return { status: 'updated' };
}

export async function POST(req: NextRequest) {
  if (req.method === 'POST') {
    try {
      const deviceInfo: DeviceInfoRequest = await req.json();

      if (!deviceInfo.deviceId) {
        return new NextResponse(JSON.stringify({ error: 'Device identifier is required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      const result = await updateOrCreateUserInfo(deviceInfo);

      if (result.status === 'created') {
        return new NextResponse(JSON.stringify({ status: result.status, shouldStart: result.shouldStart }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      return new NextResponse(JSON.stringify({ status: result.status }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });

    } catch (error: any) {
      console.error('Error processing device info:', error.message);
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