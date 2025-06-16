import { NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = "https://lwphsims-uat.up.railway.app";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: body.email
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { 
        status: {
          success: false,
          message: error.response?.data?.status?.message || 'Failed to send verification code'
        }
      },
      { status: error.response?.status || 500 }
    );
  }
} 