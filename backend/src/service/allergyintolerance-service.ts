import axios, { AxiosResponse } from 'axios';
import { AllergyIntolerance } from '../interfaces/AllergyTolerance/allergy-intolerance';
import { Bundle } from '../interfaces/AllergyTolerance/bundle';

const FHIR_BASE_URL = process.env.FHIR_BASE_URL as string;  // e.g. "https://fhir.sandboxcerner.com/{tenant}/r4"

function buildQueryParams(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "";
  const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`);
  return "?" + qs.join("&");
}

/**
 * Fetch allergy intolerance bundle using query filters
 * @param filters possible query parameters (patient, _id, _lastUpdated, clinical-status, _revinclude)
 * @param tokenResponse Optional token from MCP request
 */
async function getAllergyIntolerances(
  filters: {
    patient?: string;
    _id?: string;
    _lastUpdated?: string;   // e.g. "gt2020-01-01T00:00:00Z"
    clinicalStatus?: string; // e.g. "active"
    _revinclude?: string;    // e.g. "Provenance:target"
  },
  accessToken?: any
): Promise<Bundle<AllergyIntolerance>> {
  const url = `${FHIR_BASE_URL}/AllergyIntolerance${buildQueryParams(filters)}`;
  console.log('Making FHIR request to:', url);
  console.log('Using token:', accessToken ? 'Token present' : 'No token');

  try {
    const response: AxiosResponse<Bundle<AllergyIntolerance>> = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/fhir+json",
      },
    });

    console.log('FHIR response status:', response.status);
    return response.data;
  } catch (error: any) {
    console.error('FHIR request failed:', {
      url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
}

/**
 * Extract allergy code descriptions from FHIR Bundle response
 * @param bundle FHIR Bundle<AllergyIntolerance> response from getAllergyIntolerances
 * @returns string[] Array of allergy code text descriptions
 */
function extractAllergyDescriptions(bundle: Bundle<AllergyIntolerance>): string[] {
  const descriptions: string[] = [];

  if (bundle.entry && Array.isArray(bundle.entry)) {
    for (const entry of bundle.entry) {
      if (entry.resource && entry.resource.code && entry.resource.code.text) {
        descriptions.push(entry.resource.code.text);
      }
    }
  }

  return descriptions;
}

export { getAllergyIntolerances, extractAllergyDescriptions };
export default { getAllergyIntolerances, extractAllergyDescriptions };
