import axios, { AxiosResponse } from "axios";
import {FamilyMemberHistory,Bundle} from '../interfaces/FamilyMemberHistory/familymemberhistory'

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
 * Fetch FamilyMemberHistory resources from the FHIR server
 */
export async function getFamilyMemberHistory(
  filters: {
    _id?: string;
    patient?: string;                      // e.g. "Patient/12345"
    relationship?: string;                 // e.g. "mother", "father"
    status?: "partial" | "completed" | "entered-in-error" | "health-unknown";
    date?: string;                         // e.g. "gt2020-01-01"
    sex?: "male" | "female" | "other" | "unknown";
    _count?: string;
    _revinclude?: string;
    _include?: string;
    _sort?: string;
    _page?: string;
  },
  accessToken?: string
): Promise<Bundle<FamilyMemberHistory>> {
  const url = `${FHIR_BASE_URL}/FamilyMemberHistory${buildQueryParams(filters)}`;

  console.log("Making FHIR request to:", url);
  console.log("Using token:", accessToken ? "Token present" : "No token");

  try {
    const response: AxiosResponse<Bundle<FamilyMemberHistory>> = await axios.get(url, {
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
