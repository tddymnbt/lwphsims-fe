import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const API_BASE_URL = 'https://lwphsims-uat.up.railway.app';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json(
        { status: { success: false, message: 'No authorization token provided' } },
        { status: 401 }
      );
    }

    console.log('Fetching client with ID:', params.id);
    console.log('Using token:', token);

    const response = await axios.get(`${API_BASE_URL}/clients/${params.id}`, {
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      }
    });

    console.log('API Response:', response.data);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error in API route:', error);
    if (error.response?.status === 404) {
      return NextResponse.json(
        { status: { success: false, message: 'Client not found' } },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { status: { success: false, message: 'Failed to fetch client data' } },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json(
        { status: { success: false, message: 'No authorization token provided' } },
        { status: 401 }
      );
    }
    const body = await request.json();
    const response = await axios.put(
      `${API_BASE_URL}/clients/${params.id}`,
      body,
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
      }
    );
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { status: { success: false, message: error?.response?.data?.status?.message || 'Failed to update client' } },
      { status: error?.response?.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json(
        { status: { success: false, message: 'No authorization token provided' } },
        { status: 401 }
      );
    }
    const body = await request.json();
    const response = await axios.delete(
      `${API_BASE_URL}/clients/${params.id}`,
      {
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        data: body,
      }
    );
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { status: { success: false, message: error?.response?.data?.status?.message || 'Failed to delete client' } },
      { status: error?.response?.status || 500 }
    );
  }
} 