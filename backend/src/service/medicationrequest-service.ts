import axios, { AxiosRequestConfig } from "axios";
import {MedicationRequestQueryParams,MedicationRequestBundle} from '../interfaces/MedicationRequest/medicationrequest'

// FHIR base URL (replace with your actual FHIR endpoint)
const FHIR_BASE_URL = process.env.FHIR_BASE_URL;

/**
 * Fetches MedicationRequest resources from the FHIR server
 * @param authToken OAuth2 Bearer token
 * @param params Query parameters for the request
 */
export async function getMedicationRequests(
   params: MedicationRequestQueryParams,
   accessToken?: any
): Promise<MedicationRequestBundle> {
  const url = `${FHIR_BASE_URL}/MedicationRequest`;
  
  const config: AxiosRequestConfig = {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/fhir+json"
    },
    params: params
  };

  console.log("Making FHIR request to:", url);
  console.log("Using token:", accessToken ? "Token present" : "No token");

  try {
    const response = await axios.get<MedicationRequestBundle>(url, config);
    // you may want to validate response.data.resourceType === "Bundle"
    return response.data;
  } catch (err) {
    // improve error handling as needed
    console.error("Error fetching MedicationRequest bundle:", err);
    throw err;
  }
}
