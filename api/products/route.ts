import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json(
        { status: { success: false, message: 'No token provided' } },
        { status: 401 }
      );
    }

    const response = await axios.get('https://lwphsims-uat.up.railway.app/products', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        isConsigned: searchParams.get('isConsigned') || 'Y',
        pageNumber: searchParams.get('pageNumber') || 1,
        displayPerPage: searchParams.get('displayPerPage') || 100,
        sortBy: searchParams.get('sortBy') || 'name',
        orderBy: searchParams.get('orderBy') || 'asc'
      }
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { 
        status: { 
          success: false, 
          message: error.response?.data?.message || 'Failed to fetch products' 
        } 
      },
      { status: error.response?.status || 500 }
    );
  }
} 