"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allergyIntoleranceAPI = exports.AllergyIntoleranceAPI = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_js_1 = require("../logger.js");
class AllergyIntoleranceAPI {
    constructor() {
        this.baseUrl = process.env.FHIR_BASE_URL;
        this.accessToken = process.env.FHIR_ACCESS_TOKEN;
        if (!this.baseUrl) {
            throw new Error('FHIR_BASE_URL environment variable is not set');
        }
        if (!this.accessToken) {
            throw new Error('FHIR_ACCESS_TOKEN environment variable is not set');
        }
    }
    /**
     * SEARCH: Get AllergyIntolerance resources matching search criteria
     * GET /AllergyIntolerance?[search parameters]
     * @param searchParams FHIR search parameters
     * @param requestId Optional request ID for tracking
     */
    async search(searchParams, requestId = this.generateRequestId()) {
        return this.getRequest('/AllergyIntolerance', searchParams, requestId, 'SEARCH');
    }
    /**
     * READ: Get a specific AllergyIntolerance resource by ID
     * GET /AllergyIntolerance/{id}
     * @param id Resource ID
     * @param requestId Optional request ID for tracking
     */
    async read(id, requestId = this.generateRequestId()) {
        if (!id?.trim()) {
            throw new Error('Resource ID is required');
        }
        return this.getRequest(`/AllergyIntolerance/${id}`, {}, requestId, 'READ', id);
    }
    /**
     * VREAD: Get a specific version of an AllergyIntolerance resource
     * GET /AllergyIntolerance/{id}/_history/{vid}
     * @param id Resource ID
     * @param vid Version ID
     * @param requestId Optional request ID for tracking
     */
    async vread(id, vid, requestId = this.generateRequestId()) {
        if (!id?.trim()) {
            throw new Error('Resource ID is required');
        }
        if (!vid?.trim()) {
            throw new Error('Version ID is required');
        }
        return this.getRequest(`/AllergyIntolerance/${id}/_history/${vid}`, {}, requestId, 'VREAD', id, vid);
    }
    /**
     * HISTORY: Get history for a specific AllergyIntolerance resource
     * GET /AllergyIntolerance/{id}/_history
     * @param id Resource ID
     * @param searchParams History search parameters (_since, _count, etc.)
     * @param requestId Optional request ID for tracking
     */
    async history(id, searchParams, requestId = this.generateRequestId()) {
        if (!id?.trim()) {
            throw new Error('Resource ID is required');
        }
        return this.getRequest(`/AllergyIntolerance/${id}/_history`, searchParams, requestId, 'HISTORY', id);
    }
    /**
     * HISTORY-TYPE: Get complete history of all AllergyIntolerance resources
     * GET /AllergyIntolerance/_history
     * @param searchParams History search parameters
     * @param requestId Optional request ID for tracking
     */
    async historyType(searchParams, requestId = this.generateRequestId()) {
        return this.getRequest('/AllergyIntolerance/_history', searchParams, requestId, 'HISTORY-TYPE');
    }
    /**
     * General HTTP GET method for FHIR REST operations
     */
    async getRequest(path, queryParams = {}, requestId, operation, resourceId, versionId) {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();
        try {
            let url = `${this.baseUrl}${path}`;
            // Add query parameters
            const params = new URLSearchParams();
            Object.entries(queryParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    if (Array.isArray(value)) {
                        params.set(key, value.join(','));
                    }
                    else {
                        params.set(key, String(value));
                    }
                }
            });
            const queryString = params.toString();
            if (queryString) {
                url += `?${queryString}`;
            }
            // Log request
            const logData = {
                requestId,
                url,
                operation,
                ...(resourceId && { resourceId }),
                ...(versionId && { versionId }),
                queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
                timestamp
            };
            logger_js_1.logger.info(logData, `Making FHIR ${operation} request`);
            const response = await axios_1.default.get(url, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/json+fhir',
                    'Content-Type': 'application/json+fhir',
                    'X-Request-ID': requestId,
                    'User-Agent': 'AllergyIntolerance-API/1.0'
                },
                timeout: 30000
            });
            const requestTime = Date.now() - startTime;
            const totalCount = response.data.total || response.data.entry?.length || 0;
            const successResponse = {
                success: true,
                data: response.data,
                metadata: {
                    requestId,
                    timestamp,
                    url,
                    requestTime,
                    totalResults: totalCount,
                    operation
                }
            };
            // Log success
            logger_js_1.logger.info(JSON.stringify({
                level: 30,
                time: timestamp,
                pid: process.pid,
                hostname: 'localhost',
                msg: `FHIR ${operation} request completed successfully`,
                requestId,
                url,
                operation,
                status: response.status,
                totalResults: totalCount,
                requestTime,
                ...(resourceId && { resourceId }),
                ...(versionId && { versionId })
            }));
            return successResponse;
        }
        catch (error) {
            const requestTime = Date.now() - startTime;
            let errorMessage = 'Unknown error occurred';
            let errorCode = 'UNKNOWN_ERROR';
            let statusCode;
            if (error.response) {
                statusCode = error.response.status;
                if (statusCode === 404) {
                    errorMessage = `${operation}${resourceId ? ` for resource ${resourceId}` : ''} not found`;
                    errorCode = 'NOT_FOUND';
                }
                else {
                    errorMessage = error.response.data?.issue?.[0]?.details?.text ||
                        error.response.data?.issue?.[0]?.diagnostics ||
                        error.response.statusText ||
                        'HTTP error';
                    errorCode = `HTTP_${statusCode}`;
                }
            }
            else if (error.request) {
                errorMessage = 'Network request failed';
                errorCode = 'NETWORK_ERROR';
            }
            else if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout';
                errorCode = 'TIMEOUT_ERROR';
            }
            const errorResponse = {
                success: false,
                error: {
                    message: errorMessage,
                    code: errorCode,
                    details: error.message
                },
                metadata: {
                    requestId,
                    timestamp,
                    url: `${this.baseUrl}${path}`,
                    requestTime,
                    statusCode,
                    operation
                }
            };
            // Log error
            logger_js_1.logger.error(JSON.stringify({
                level: 50,
                time: timestamp,
                pid: process.pid,
                hostname: 'localhost',
                msg: `FHIR ${operation} request failed`,
                requestId,
                url: `${this.baseUrl}${path}`,
                operation,
                error: errorMessage,
                errorCode,
                statusCode,
                requestTime,
                ...(resourceId && { resourceId }),
                ...(versionId && { versionId })
            }));
            return errorResponse;
        }
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.AllergyIntoleranceAPI = AllergyIntoleranceAPI;
// Export singleton instance for convenience
exports.allergyIntoleranceAPI = new AllergyIntoleranceAPI();
// Export class for custom instances
exports.default = AllergyIntoleranceAPI;
