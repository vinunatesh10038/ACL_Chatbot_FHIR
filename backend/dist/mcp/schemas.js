"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMedicationRequestsInput = exports.GetPatientsInput = exports.ErrorResponse = exports.GetAllergyIntolerancesInput = void 0;
const zod_1 = require("zod");
// AllergyIntolerance API schemas for MCP routes
// Input schemas
exports.GetAllergyIntolerancesInput = zod_1.z.object({
    patient: zod_1.z.string().optional(),
    _id: zod_1.z.string().optional(),
    _lastUpdated: zod_1.z.string().optional(),
    clinicalStatus: zod_1.z.string().optional(),
    _revinclude: zod_1.z.string().optional()
});
// Error Response Schema
exports.ErrorResponse = zod_1.z.object({
    error: zod_1.z.object({
        message: zod_1.z.string(),
        code: zod_1.z.string(),
        details: zod_1.z.any().optional()
    }),
    metadata: zod_1.z.object({
        requestId: zod_1.z.string(),
        timestamp: zod_1.z.string(),
        url: zod_1.z.string(),
        requestTime: zod_1.z.number(),
        statusCode: zod_1.z.number().optional()
    })
});
// Input schema for MCP route: getPatients
exports.GetPatientsInput = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(),
    birthdate: zod_1.z.string().optional(), // e.g., gt2020-01-01
    gender: zod_1.z.enum(['male', 'female', 'other', 'unknown']).optional(),
    _revinclude: zod_1.z.string().optional()
});
exports.GetMedicationRequestsInput = zod_1.z.object({
    "-timing-boundsPeriod": zod_1.z.string().optional(), // e.g., "ge2014-05-19T20:54:02.000Z"
    _count: zod_1.z.number().int().positive().optional(), // max number of results to return
    _id: zod_1.z.string().optional(), // FHIR logical ID of the resource
    _lastUpdated: zod_1.z.string().optional(), // e.g., "ge2014-05-19T20:54:02.000Z"
    _revinclude: zod_1.z.string().optional(), // e.g., "Provenance:target"
    intent: zod_1.z
        .enum([
        "proposal",
        "plan",
        "order",
        "original-order",
        "reflex-order",
        "filler-order",
        "instance-order",
        "option",
    ])
        .or(zod_1.z.string()) // allow multiple comma-separated values, e.g., "order,plan"
        .optional(),
    patient: zod_1.z.string().optional(), // patient logical ID or full reference (e.g., "Patient/12742400")
    status: zod_1.z
        .enum([
        "active",
        "on-hold",
        "cancelled",
        "completed",
        "entered-in-error",
        "stopped",
        "draft",
        "unknown",
    ])
        .or(zod_1.z.string()) // allow comma-separated values like "active,completed"
        .optional(),
});
