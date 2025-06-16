import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = 'https://lwphsims-uat.up.railway.app';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await axios.post(
      `${API_BASE_URL}/auth/login/resend`,
      body,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { status: { success: false, message: error?.response?.data?.status?.message || 'Failed to resend OTP.' } },
      { status: error?.response?.status || 500 }
    );
  }
} 