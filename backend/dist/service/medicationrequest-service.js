"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMedicationRequests = getMedicationRequests;
const axios_1 = __importDefault(require("axios"));
// FHIR base URL (replace with your actual FHIR endpoint)
const FHIR_BASE_URL = process.env.FHIR_BASE_URL;
/**
 * Fetches MedicationRequest resources from the FHIR server
 * @param authToken OAuth2 Bearer token
 * @param params Query parameters for the request
 */
async function getMedicationRequests(params, accessToken) {
    const url = `${FHIR_BASE_URL}/MedicationRequest`;
    const config = {
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/fhir+json"
        },
        params: params
    };
    console.log("Making FHIR request to:", url);
    console.log("Using token:", accessToken ? "Token present" : "No token");
    try {
        const response = await axios_1.default.get(url, config);
        // you may want to validate response.data.resourceType === "Bundle"
        return response.data;
    }
    catch (err) {
        // improve error handling as needed
        console.error("Error fetching MedicationRequest bundle:", err);
        throw err;
    }
}
