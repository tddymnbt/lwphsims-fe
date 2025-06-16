"use server";

import { headers } from "next/headers";
import axios from "axios";

const API_BASE_URL = 'https://lwphsims-uat.up.railway.app';

export async function getClients() {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    
    if (!authHeader) {
      throw new Error("No authorization header found");
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      throw new Error("No authentication token found. Please log in again.");
    }

    console.log("Fetching clients with token:", token);

    const response = await axios.get(`${API_BASE_URL}/clients`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log("API Response:", response.data);

    if (response.data.status?.success) {
      return {
        success: true,
        data: response.data.data.map((c: any) => ({
          id: c.external_id,
          name: `${c.first_name} ${c.last_name}`,
          email: c.email,
          phone: c.contact_no || "",
          status: c.is_active ? "Active" : "Inactive",
          isConsignor: c.is_consignor || false,
          consignments: c.consignments_count || 0,
          totalValue: c.total_value || "",
        })),
      };
    }

    return {
      success: false,
      error: response.data.status?.message || "Failed to fetch clients",
    };
  } catch (error: any) {
    console.error("Error fetching clients:", error);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        error: "Authentication failed. Please log in again.",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to fetch clients",
    };
  }
} 