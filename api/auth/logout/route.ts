import { NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = "https://lwphsims-uat.up.railway.app";

export async function POST(request: Request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    
    if (!token) {
      return NextResponse.json(
        { message: "No token provided" },
        { status: 401 }
      );
    }

    const response = await axios.post(
      `${API_BASE_URL}/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { 
        message: error.response?.data?.message || "Failed to logout",
        error: error.response?.data?.error || "Unauthorized",
        statusCode: error.response?.status || 401
      },
      { status: error.response?.status || 401 }
    );
  }
} 