import axios, { AxiosResponse } from "axios";
import {Procedure,Bundle} from '../interfaces/Procedure/procedure'

// FHIR base URL (replace with your actual FHIR endpoint)
const FHIR_BASE_URL = process.env.FHIR_BASE_URL;

// Helper function to build query string
function buildQueryParams(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "";
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`);
  return "?" + qs.join("&");
}

export async function getProcedures(
  filters: {
    _id?: string;
    patient?: string;
    subject?: string;
    date?: string;
    _lastUpdated?: string;
    category?: string;
    code?: string;
    _revinclude?: string;
    _count?: string;
    _include?: string;
    _sort?: string;
    _page?: string;
  },
  accessToken?: string
): Promise<Bundle<Procedure>> {
  const url = `${FHIR_BASE_URL}/Procedure${buildQueryParams(filters)}`;

  console.log("Making FHIR request to:", url);
  console.log("Using token:", accessToken ? "Token present" : "No token");

  try {
    const response: AxiosResponse<Bundle<Procedure>> = await axios.get(url, {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
        Accept: "application/fhir+json",
      },
      timeout: 60000, // adjust if needed
    });

    console.log("FHIR response status:", response.status);
    return response.data;
  } catch (error: any) {
    console.error("FHIR request failed:", {
      url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });
    throw error;
  }
}
