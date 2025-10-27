"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpRouter = void 0;
const express_1 = __importDefault(require("express"));
const schemas_1 = require("./schemas");
const allergyintolerance_service_1 = require("../service/allergyintolerance-service");
const patient_service_1 = require("../service/patient-service");
const medicationrequest_service_1 = require("../service/medicationrequest-service");
exports.mcpRouter = express_1.default.Router();
// Middleware for error handling
const handleApiError = (error, res, operation, req) => {
    console.error(`${operation} failed:`, error);
    const statusCode = error.response?.status || error.statusCode || 500;
    const errorResponse = {
        error: {
            message: error.message || 'Internal error',
            code: error.code || 'INTERNAL_ERROR',
            details: error.response?.data || error.details
        },
        metadata: {
            requestId: Math.random().toString(36).substring(2, 15),
            timestamp: new Date().toISOString(),
            url: req.url,
            requestTime: Date.now()
        }
    };
    res.status(statusCode).json(errorResponse);
};
// Extract allergy descriptions from FHIR bundle
exports.mcpRouter.post('/get_allergy_intolerances', async (req, res) => {
    const parse = schemas_1.GetAllergyIntolerancesInput.safeParse(req.body);
    const accessToken = req.body.token;
    if (!parse.success) {
        return res.status(400).json({
            error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: parse.error.flatten().fieldErrors
            },
            metadata: {
                requestId: Math.random().toString(36).substring(2, 15),
                timestamp: new Date().toISOString(),
                url: req.url,
                requestTime: Date.now()
            }
        });
    }
    try {
        const bundle = await (0, allergyintolerance_service_1.getAllergyIntolerances)(parse.data, accessToken);
        const descriptions = (0, allergyintolerance_service_1.extractAllergyDescriptions)(bundle);
        res.json({
            success: true,
            descriptions: descriptions,
            count: descriptions.length,
            metadata: {
                requestId: Math.random().toString(36).substring(2, 15),
                timestamp: new Date().toISOString(),
                url: req.url,
                requestTime: Date.now()
            }
        });
    }
    catch (err) {
        handleApiError(err, res, 'get_allergy_descriptions', req);
    }
});
exports.mcpRouter.post('/get_patients', async (req, res) => {
    const parse = schemas_1.GetPatientsInput.safeParse(req.body);
    const accessToken = req.body.token;
    if (!parse.success) {
        return res.status(400).json({
            error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: parse.error.flatten().fieldErrors
            },
            metadata: {
                requestId: Math.random().toString(36).substring(2, 15),
                timestamp: new Date().toISOString(),
                url: req.url,
                requestTime: Date.now()
            }
        });
    }
    try {
        const bundle = await (0, patient_service_1.getPatients)(parse.data, accessToken); // Your service function
        // Extract patient details from the bundle
        const patients = bundle.entry?.map((e) => ({
            id: e.resource.id,
            name: e.resource.name?.map(n => n.text).join(', ') || '',
            birthDate: e.resource.birthDate,
            gender: e.resource.gender
        })) || [];
        res.json({
            success: true,
            patients: patients,
            count: patients.length,
            metadata: {
                requestId: Math.random().toString(36).substring(2, 15),
                timestamp: new Date().toISOString(),
                url: req.url,
                requestTime: Date.now()
            }
        });
    }
    catch (err) {
        handleApiError(err, res, 'get_patients', req);
    }
});
exports.mcpRouter.post('/get_medication_requests', async (req, res) => {
    // Validate incoming body
    const parse = schemas_1.GetMedicationRequestsInput.safeParse(req.body);
    const accessToken = req.body.token;
    if (!parse.success) {
        return res.status(400).json({
            error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: parse.error.flatten().fieldErrors,
            },
            metadata: {
                requestId: Math.random().toString(36).substring(2, 15),
                timestamp: new Date().toISOString(),
                url: req.url,
                requestTime: Date.now(),
            },
        });
    }
    try {
        // Call your FHIR service to fetch MedicationRequest bundle
        const bundle = await (0, medicationrequest_service_1.getMedicationRequests)(parse.data, accessToken);
        // Extract relevant MedicationRequest details from the bundle
        const medicationRequests = bundle.entry?.map((entry) => {
            const resource = entry.resource;
            if (!resource || resource.resourceType !== "MedicationRequest")
                return null;
            return {
                id: resource.id,
                status: resource.status,
                intent: resource.intent,
                medication: resource.medicationCodeableConcept?.text ||
                    resource.medicationReference?.display ||
                    "",
                patient: resource.subject?.reference || "",
                authoredOn: resource.authoredOn || "",
                requester: resource.requester?.display || "",
            };
        }).filter(Boolean) || [];
        // Successful response
        res.json({
            success: true,
            medicationRequests,
            count: medicationRequests.length,
            metadata: {
                requestId: Math.random().toString(36).substring(2, 15),
                timestamp: new Date().toISOString(),
                url: req.url,
                requestTime: Date.now(),
            },
        });
    }
    catch (err) {
        handleApiError(err, res, 'get_medication_requests', req);
    }
});
// Legacy route names for backward compatibility
// mcpRouter.post('/get_allergy_intolerances', async (req: Request, res: Response) => {
//   const parse = GetAllergyIntolerancesInput.safeParse(req.body);
//   if (!parse.success) {
//     return res.status(400).json({
//       error: {
//         message: 'Validation failed',
//         code: 'VALIDATION_ERROR',
//         details: parse.error.flatten().fieldErrors
//       },
//       metadata: {
//         requestId: Math.random().toString(36).substring(2, 15),
//         timestamp: new Date().toISOString(),
//         url: req.url,
//         requestTime: Date.now()
//       }
//     });
//   }
//   try {
//     const bundle = await getAllergyIntolerances(parse.data);
//     res.setHeader('Content-Type', 'application/json+fhir');
//     res.json(GetAllergyIntolerancesResponse.parse(bundle));
//   } catch (err: any) {
//     handleApiError(err, res, 'get_allergy_intolerances_legacy', req);
//   }
// });
exports.default = exports.mcpRouter;
