import express, { Request, Response } from 'express';
import {
  GetAllergyIntolerancesInput, GetPatientsInput, GetMedicationRequestsInput, GetFamilyMemberHistoryInput, GetImmunizationsInput, GetPersonsInput,
  GetProceduresInput
} from './schemas';
import {
  getAllergyIntolerances,
  extractAllergyDescriptions
} from '../service/allergyintolerance-service';
import {
  getPatients
} from '../service/patient-service';
import {
  getMedicationRequests
} from '../service/medicationrequest-service';
import {
  getFamilyMemberHistory
} from '../service/familymemberhistory-service';
import {
  getImmunizations
} from '../service/immunization-service';
import {
  getPersons
} from '../service/person-service';
import {
  getProcedures
} from '../service/procedure-service';

export const mcpRouter = express.Router();

// Middleware for error handling
const handleApiError = (error: any, res: Response, operation: string, req: Request) => {
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
mcpRouter.post('/get_allergy_intolerances', async (req: Request, res: Response) => {
  const parse = GetAllergyIntolerancesInput.safeParse(req.body);
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
    const bundle = await getAllergyIntolerances(parse.data, accessToken);
    const descriptions = extractAllergyDescriptions(bundle);
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
  } catch (err: any) {
    handleApiError(err, res, 'get_allergy_descriptions', req);
  }
});

mcpRouter.post('/get_patients', async (req: Request, res: Response) => {
  const parse = GetPatientsInput.safeParse(req.body);
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
    const bundle = await getPatients(parse.data, accessToken); // Your service function

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
  } catch (err: any) {
    handleApiError(err, res, 'get_patients', req);
  }
});

mcpRouter.post('/get_medication_requests', async (req: Request, res: Response) => {
  // Validate incoming body
  const parse = GetMedicationRequestsInput.safeParse(req.body);
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
    const bundle = await getMedicationRequests(parse.data, accessToken);

    // Extract relevant MedicationRequest details from the bundle
    const medicationRequests = bundle.entry?.map((entry) => {
      const resource = entry.resource;
      if (!resource || resource.resourceType !== "MedicationRequest") return null;

      return {
        id: resource.id,
        status: resource.status,
        intent: resource.intent,
        medication:
          resource.medicationCodeableConcept?.text ||
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
  } catch (err: any) {
    handleApiError(err, res, 'get_medication_requests', req);
  }
});

mcpRouter.post("/get_family_member_history", async (req: Request, res: Response) => {
  // 🧩 1. Validate incoming request body
  const parse = GetFamilyMemberHistoryInput.safeParse(req.body);
  const accessToken = req.body.token;

  if (!parse.success) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
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
    // ⚙️ 2. Call your FHIR service to fetch FamilyMemberHistory bundle
    const bundle = await getFamilyMemberHistory(
      parse.data, // or pass explicitly
      accessToken
    );

    // 🧾 3. Extract and simplify relevant FamilyMemberHistory details
    const histories =
      bundle.entry?.map((entry) => {
        const resource = entry.resource;
        if (!resource || resource.resourceType !== "FamilyMemberHistory") return null;

        const conditions =
          resource.condition?.map((cond: any) => {
            const conditionName =
              cond.code?.text ||
              cond.code?.coding?.[0]?.display ||
              "(Unknown Condition)";

            // Look for modifierExtension.valueCodeableConcept.text (e.g., "POSITIVE", "NEGATIVE")
            const modifier =
              cond.modifierExtension?.[0]?.valueCodeableConcept?.text ||
              cond.modifierExtension?.[0]?.valueCodeableConcept?.coding?.[0]
                ?.display ||
              "";

            // Normalize casing: "POSITIVE" → "Positive", "NEGATIVE" → "Negative"
            const formattedModifier = modifier
              ? modifier.charAt(0).toUpperCase() +
              modifier.slice(1).toLowerCase()
              : "";

            // Combine both into readable output
            return formattedModifier
              ? `${conditionName} - ${formattedModifier}`
              : conditionName;
          }) || [];

        return {
          id: resource.id,
          status: resource.status,
          patient: resource.patient?.reference || "",
          relationship:
            resource.relationship?.text ||
            resource.relationship?.coding?.[0]?.display ||
            "",
          sex: resource.sex?.text || resource.sex?.coding?.[0]?.display || "",
          date: resource.date || "",
          note: resource.note?.map((n) => n.text).join("; ") || "",
          conditions
        };
      }).filter(Boolean) || [];

    // ✅ 4. Successful response
    res.json({
      success: true,
      familyMemberHistories: histories,
      count: histories.length,
      metadata: {
        requestId: Math.random().toString(36).substring(2, 15),
        timestamp: new Date().toISOString(),
        url: req.url,
        requestTime: Date.now(),
      },
    });
  } catch (err: any) {
    handleApiError(err, res, "get_family_member_history", req);
  }
});

mcpRouter.post("/get_immunizations", async (req: Request, res: Response) => {
  // 🧩 1. Validate incoming request body
  const parse = GetImmunizationsInput.safeParse(req.body);
  const accessToken = req.body.token;

  if (!parse.success) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
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
    // ⚙️ 2. Call your FHIR service to fetch Immunization bundle
    const bundle = await getImmunizations(parse.data, accessToken);

    // 🧾 3. Extract and simplify relevant Immunization details
    const immunizations =
      bundle.entry
        ?.map((entry) => {
          const resource = entry.resource;
          if (!resource || resource.resourceType !== "Immunization") return null;

          return {
            id: resource.id,
            status: resource.status || "",
            patient: resource.patient?.reference || "",
            vaccine:
              resource.vaccineCode?.text ||
              resource.vaccineCode?.coding?.[0]?.display ||
              "",
            date: resource.occurrenceDateTime || "",
            targetDisease:
              resource.protocolApplied?.[0]?.targetDisease?.[0]?.coding?.[0]
                ?.display || "",
            manufacturer: resource.manufacturer?.display || "",
            lotNumber: resource.lotNumber || "",
            performer:
              resource.performer?.[0]?.actor?.display ||
              resource.performer?.[0]?.actor?.reference ||
              "",
          };
        })
        .filter(Boolean) || [];

    // ✅ 4. Successful response
    res.json({
      success: true,
      immunizations,
      count: immunizations.length,
      metadata: {
        requestId: Math.random().toString(36).substring(2, 15),
        timestamp: new Date().toISOString(),
        url: req.url,
        requestTime: Date.now(),
      },
    });
  } catch (err: any) {
    handleApiError(err, res, "get_immunizations", req);
  }
});

mcpRouter.post("/get_persons", async (req: Request, res: Response) => {
  const parse = GetPersonsInput.safeParse(req.body);
  const accessToken = req.body.token;

  if (!parse.success) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
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
    const bundle = await getPersons(parse.data, accessToken);

    const persons =
      bundle.entry
        ?.map((entry) => {
          const resource = entry.resource;
          if (!resource || resource.resourceType !== "Person") return null;

          return {
            id: resource.id,
            active: resource.active ?? null,
            name: resource.name?.[0]?.text || (
              resource.name?.[0]
                ? `${resource.name?.[0].given?.join(" ") || ""} ${resource.name?.[0].family || ""}`.trim()
                : ""
            ),
            gender: resource.gender || "",
            birthDate: resource.birthDate || "",
            telecom: resource.telecom || [],
            address: resource.address?.[0]?.text || "",
          };
        })
        .filter(Boolean) || [];

    res.json({
      success: true,
      persons,
      count: persons.length,
      metadata: {
        requestId: Math.random().toString(36).substring(2, 15),
        timestamp: new Date().toISOString(),
        url: req.url,
        requestTime: Date.now(),
      },
    });
  } catch (err: any) {
    handleApiError(err, res, "get_persons", req);
  }
});

mcpRouter.post("/get_procedures", async (req: Request, res: Response) => {
  const parse = GetProceduresInput.safeParse(req.body);
  const accessToken = req.body.token;

  if (!parse.success) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
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
    const bundle = await getProcedures(parse.data, accessToken);

    const procedures =
      bundle.entry
        ?.map((entry) => {
          const resource = entry.resource;
          if (!resource || resource.resourceType !== "Procedure") return null;

          return {
            id: resource.id,
            status: resource.status || "",
            code: resource.code?.coding?.[0]?.display || "",
            subject: resource.subject?.reference || resource.patient?.reference || "",
            performed: resource.performedDateTime || resource.performedPeriod?.start || "",
            performer: resource.performer?.[0]?.actor?.display || resource.performer?.[0]?.actor?.reference || "",
            location: resource.location?.display || "",
            note: resource.note?.map((n: any) => n.text).join("; ") || ""
          };
        })
        .filter(Boolean) || [];

    res.json({
      success: true,
      procedures,
      count: procedures.length,
      metadata: {
        requestId: Math.random().toString(36).substring(2, 15),
        timestamp: new Date().toISOString(),
        url: req.url,
        requestTime: Date.now(),
      },
    });
  } catch (err: any) {
    handleApiError(err, res, "get_procedures", req);
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

export default mcpRouter;
