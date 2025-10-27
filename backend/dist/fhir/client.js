"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFhirResource = fetchFhirResource;
exports.fetchAllergyIntolerances = fetchAllergyIntolerances;
exports.extractAllergyIntolerances = extractAllergyIntolerances;
const axios_1 = __importDefault(require("axios"));
const logger_js_1 = require("../logger.js");
// Generic FHIR client function for GET requests
async function fetchFhirResource(resourceType, options, queryParams) {
    try {
        const baseUrl = process.env.FHIR_BASE_URL || options.baseUrl;
        let url = `${baseUrl}/${resourceType}`;
        if (queryParams) {
            const params = new URLSearchParams();
            Object.entries(queryParams).forEach(([key, value]) => {
                params.append(key, value);
            });
            url += `?${params.toString()}`;
        }
        logger_js_1.logger.info({
            requestId: options.requestId,
            method: 'GET',
            url,
            resourceType
        }, 'Making FHIR request');
        const response = await axios_1.default.get(url, {
            headers: {
                'Authorization': `Bearer ${options.accessToken}`,
                'Accept': 'application/json+fhir',
                'Content-Type': 'application/json+fhir',
                ...(options.requestId && { 'X-Request-ID': options.requestId })
            },
            timeout: 30000
        });
        logger_js_1.logger.info({
            requestId: options.requestId,
            status: response.status,
            statusText: response.statusText,
            dataLength: JSON.stringify(response.data).length
        }, 'FHIR request successful');
        return response.data;
    }
    catch (error) {
        const axiosError = error;
        logger_js_1.logger.error({
            requestId: options.requestId,
            error: axiosError.message,
            status: axiosError.response?.status,
            statusText: axiosError.response?.statusText,
            url: axiosError.config?.url,
            resourceType
        }, 'FHIR request failed');
        if (axiosError.response?.data) {
            logger_js_1.logger.error({
                requestId: options.requestId,
                responseData: axiosError.response.data
            }, 'FHIR error response body');
        }
        throw error;
    }
}
// Specific function for AllergyIntolerance
async function fetchAllergyIntolerances(options, queryParams) {
    return fetchFhirResource('AllergyIntolerance', options, queryParams);
}
// Helper to extract AllergyIntolerance resources from Bundle
function extractAllergyIntolerances(bundle) {
    return bundle.entry?.filter(entry => entry.resource).map(entry => entry.resource) || [];
}
