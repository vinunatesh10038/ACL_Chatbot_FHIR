import { z } from 'zod';

// AllergyIntolerance API schemas for MCP routes

// Input schemas
export const GetAllergyIntolerancesInput = z.object({
  patient: z.string().optional(),
  _id: z.string().optional(),
  _lastUpdated: z.string().optional(),
  clinicalStatus: z.string().optional(),
  _revinclude: z.string().optional()
});

// Error Response Schema
export const ErrorResponse = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
    details: z.any().optional()
  }),
  metadata: z.object({
    requestId: z.string(),
    timestamp: z.string(),
    url: z.string(),
    requestTime: z.number(),
    statusCode: z.number().optional()
  })
});


// Input schema for MCP route: getPatients
export const GetPatientsInput = z.object({
  _id: z.string().optional(),
  name: z.string().optional(),
  birthdate: z.string().optional(), // e.g., gt2020-01-01
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  _revinclude: z.string().optional()
});

export const GetMedicationRequestsInput = z.object({
  "-timing-boundsPeriod": z.string().optional(), // e.g., "ge2014-05-19T20:54:02.000Z"
  _count: z.number().int().positive().optional(), // max number of results to return
  _id: z.string().optional(), // FHIR logical ID of the resource
  _lastUpdated: z.string().optional(), // e.g., "ge2014-05-19T20:54:02.000Z"
  _revinclude: z.string().optional(), // e.g., "Provenance:target"
  intent: z
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
    .or(z.string()) // allow multiple comma-separated values, e.g., "order,plan"
    .optional(),
  patient: z.string().optional(), // patient logical ID or full reference (e.g., "Patient/12742400")
  status: z
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
    .or(z.string()) // allow comma-separated values like "active,completed"
    .optional(),
});

export const GetFamilyMemberHistoryInput = z.object({
  _id: z.string().optional(),                          // Search by resource ID
  patient: z.string().optional(),                      // Patient reference (e.g., 'Patient/12345')
  relationship: z.string().optional(),                 // Filter by relationship type (e.g., 'mother', 'father')
  status: z.enum(['partial', 'completed', 'entered-in-error', 'health-unknown']).optional(),
  date: z.string().optional(),                         // Date of last update or assertion
  sex: z.enum(['male', 'female', 'other', 'unknown']).optional(), // Family member’s sex
  _count: z.string().optional(),                       // Page size
  _revinclude: z.string().optional(),                  // Include related resources
  _include: z.string().optional(),                     // Include related patient data
  _sort: z.string().optional(),                        // Sort field (e.g., 'date')
  _page: z.string().optional(),                        // For pagination
});

export const GetImmunizationsInput = z.object({
  _id: z.string().optional(),
  patient: z.string(),
  date: z.string().optional(),
  status: z.string().optional(),
  vaccineCode: z.string().optional(),
  targetDisease: z.string().optional(),
  _count: z.string().optional(),
  _include: z.string().optional(),
  _revinclude: z.string().optional(),
  _sort: z.string().optional(),
  _page: z.string().optional()
});

export const GetPersonsInput = z.object({
  _id: z.string().optional(),                // single id (docs show array allowed; single string is convenient)
  identifier: z.string().optional(),         // e.g. urn:oid:2.16.840.1.113883.3.13.6|01022228
  name: z.string().optional(),               // search by name
  gender: z.enum(["male", "female", "other", "unknown"]).optional(),
  birthdate: z.string().optional(),          // e.g., gt2020-01-01
  _count: z.string().optional(),
  _page: z.string().optional(),
  _include: z.string().optional(),
  _revinclude: z.string().optional()
});

export const GetProceduresInput = z.object({
  _id: z.string().optional(),                 // resource id (required if patient/subject not used)
  patient: z.string().optional(),             // patient ID (required if _id/subject not used)
  subject: z.string().optional(),             // e.g., "Patient/12345"
  date: z.string().optional(),                // e.g., "ge2015-09-24T00:00:00Z"
  _lastUpdated: z.string().optional(),        // lastUpdated filter (note: cannot be used with date)
  category: z.string().optional(),
  code: z.string().optional(),
  _revinclude: z.string().optional(),         // e.g., "Provenance:target"
  _count: z.string().optional(),
  _include: z.string().optional(),
  _sort: z.string().optional(),
  _page: z.string().optional()
});



