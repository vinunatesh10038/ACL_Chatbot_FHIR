import axios, { AxiosResponse } from "axios";
import {Patient, Bundle } from '../interfaces/Patient/patient';

// FHIR base URL (replace with your actual FHIR endpoint)
const FHIR_BASE_URL = process.env.FHIR_BASE_URL;

// Helper function to build query string
function buildQueryParams(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "";
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`);
  return "?" + qs.join("&");
}

/**
 * Fetch Patient bundle using query filters
 * @param filters possible query parameters (_id, name, birthdate, gender, _revinclude)
 * @param tokenResponse Optional access token from MCP request
 */
export async function getPatients(
  filters: {
    _id?: string;
    name?: string;
    birthdate?: string;  // e.g. "gt2020-01-01"
    gender?: string;     // male | female | other | unknown
    _revinclude?: string;
  },
  accessToken?: string
): Promise<Bundle<Patient>> {
  const url = `${FHIR_BASE_URL}/Patient${buildQueryParams(filters)}`;

  console.log("Making FHIR request to:", url);
  console.log("Using token:", accessToken ? "Token present" : "No token");

  try {
    const response: AxiosResponse<Bundle<Patient>> = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/fhir+json",
      },
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
