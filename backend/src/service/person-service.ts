import axios, { AxiosResponse } from "axios";
import {Person,Bundle} from '../interfaces/Person/person'

// FHIR base URL (replace with your actual FHIR endpoint)
const FHIR_BASE_URL = process.env.FHIR_BASE_URL;

// Helper function to build query string
function buildQueryParams(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "";
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`);
  return "?" + qs.join("&");
}

export async function getPersons(
  filters: {
    _id?: string;
    identifier?: string;
    name?: string;
    gender?: "male" | "female" | "other" | "unknown";
    birthdate?: string;
    _count?: string;
    _page?: string;
    _include?: string;
    _revinclude?: string;
  },
  accessToken?: string
): Promise<Bundle<Person>> {
  const url = `${FHIR_BASE_URL}/Person${buildQueryParams(filters)}`;

  console.log("Making FHIR request to:", url);
  console.log("Using token:", accessToken ? "Token present" : "No token");

  try {
    const response: AxiosResponse<Bundle<Person>> = await axios.get(url, {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
        Accept: "application/fhir+json",
      },
      timeout: 60000, // 60s timeout; adjust as needed
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