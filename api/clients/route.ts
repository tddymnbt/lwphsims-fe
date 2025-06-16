import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = 'https://lwphsims-uat.up.railway.app';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Try to get the token from the Authorization header
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    if (!token) {
      return NextResponse.json({ status: { success: false, message: 'No auth token found' } }, { status: 401 });
    }

    const response = await axios.post(
      `${API_BASE_URL}/clients`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    return NextResponse.json(
      { status: { success: false, message: error?.response?.data?.status?.message} },
      { status: error?.response?.status || 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    let apiUrl = `${API_BASE_URL}/clients`;
    if (id) {
      apiUrl = `${API_BASE_URL}/clients/${id}`;
    }

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch clients' },
      { status: error.response?.status || 500 }
    );
  }
} 