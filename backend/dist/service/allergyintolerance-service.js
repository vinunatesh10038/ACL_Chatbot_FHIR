"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllergyIntolerances = getAllergyIntolerances;
exports.extractAllergyDescriptions = extractAllergyDescriptions;
const axios_1 = __importDefault(require("axios"));
const FHIR_BASE_URL = process.env.FHIR_BASE_URL; // e.g. "https://fhir.sandboxcerner.com/{tenant}/r4"
function buildQueryParams(params) {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined);
    if (entries.length === 0)
        return "";
    const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    return "?" + qs.join("&");
}
/**
 * Fetch allergy intolerance bundle using query filters
 * @param filters possible query parameters (patient, _id, _lastUpdated, clinical-status, _revinclude)
 * @param tokenResponse Optional token from MCP request
 */
async function getAllergyIntolerances(filters, accessToken) {
    const url = `${FHIR_BASE_URL}/AllergyIntolerance${buildQueryParams(filters)}`;
    console.log('Making FHIR request to:', url);
    console.log('Using token:', accessToken ? 'Token present' : 'No token');
    try {
        const response = await axios_1.default.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/fhir+json",
            },
        });
        console.log('FHIR response status:', response.status);
        return response.data;
    }
    catch (error) {
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
function extractAllergyDescriptions(bundle) {
    const descriptions = [];
    if (bundle.entry && Array.isArray(bundle.entry)) {
        for (const entry of bundle.entry) {
            if (entry.resource && entry.resource.code && entry.resource.code.text) {
                descriptions.push(entry.resource.code.text);
            }
        }
    }
    return descriptions;
}
exports.default = { getAllergyIntolerances, extractAllergyDescriptions };
