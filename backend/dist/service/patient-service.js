"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatients = getPatients;
const axios_1 = __importDefault(require("axios"));
// FHIR base URL (replace with your actual FHIR endpoint)
const FHIR_BASE_URL = process.env.FHIR_BASE_URL;
// Helper function to build query string
function buildQueryParams(params) {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined);
    if (entries.length === 0)
        return "";
    const qs = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    return "?" + qs.join("&");
}
/**
 * Fetch Patient bundle using query filters
 * @param filters possible query parameters (_id, name, birthdate, gender, _revinclude)
 * @param tokenResponse Optional access token from MCP request
 */
async function getPatients(filters, accessToken) {
    const url = `${FHIR_BASE_URL}/Patient${buildQueryParams(filters)}`;
    console.log("Making FHIR request to:", url);
    console.log("Using token:", accessToken ? "Token present" : "No token");
    try {
        const response = await axios_1.default.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/fhir+json",
            },
        });
        console.log("FHIR response status:", response.status);
        return response.data;
    }
    catch (error) {
        console.error("FHIR request failed:", {
            url,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
        });
        throw error;
    }
}
