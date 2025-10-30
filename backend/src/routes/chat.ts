import { Router } from 'express';
import { apiKeyRole, requireRole, basicAuth } from '../middleware/auth';
import { getOpenAIClient, deployment } from '../azure/openai';
import { writeAudit } from '../audit/audit';

type ConversationMemory = { lastAllergyId?: string; lastPatientId?: string; lastMedicationRequestId?: string; lastFamilyMemberHistoryId?: string; lastImmunizationId?: string; lastPersonId?: string; lastProcedureId?: string };
const memoryStore = new Map<string, ConversationMemory>();

// Simple in-memory conversation memory store (volatile)
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_allergy_intolerances',
      description: 'Search for allergy intolerances with optional filters. Returns FHIR AllergyIntolerance bundle.',
      parameters: {
        type: 'object',
        properties: {
          patient: { type: 'string', description: 'Patient reference (e.g., "Patient/12345")' },
          _id: { type: 'string', description: 'Specific AllergyIntolerance ID' },
          _lastUpdated: { type: 'string', description: 'Last updated timestamp filter' },
          clinicalStatus: { type: 'string', description: 'Clinical status filter (e.g., "active")' },
          _revinclude: { type: 'string', description: 'Include related resources' }
        },
        required: ['patient']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_patients',
      description: 'Search for patients with optional filters. Returns FHIR Patient bundle.',
      parameters: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'Specific Patient ID' },
          name: { type: 'string', description: 'Patient name filter' },
          birthdate: { type: 'string', description: 'Birthdate filter, e.g., "gt2020-01-01"' },
          gender: { type: 'string', description: 'Patient gender filter (male, female, other, unknown)' },
          _revinclude: { type: 'string', description: 'Include related resources' }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_medication_requests',
      description: 'Search for MedicationRequest resources with optional filters. Returns a FHIR MedicationRequest bundle.',
      parameters: {
        type: 'object',
        properties: {
          '-timing-boundsPeriod': {
            type: 'string',
            description: 'Filter by timing period of medication administration, e.g., "ge2014-05-19T20:54:02.000Z".'
          },
          _count: {
            type: 'integer',
            description: 'Maximum number of MedicationRequest records to return.'
          },
          _id: {
            type: 'string',
            description: 'Specific MedicationRequest ID.'
          },
          _lastUpdated: {
            type: 'string',
            description: 'Filter by last updated timestamp, e.g., "ge2020-01-01T00:00:00Z".'
          },
          _revinclude: {
            type: 'string',
            description: 'Include related Provenance or other resources, e.g., "Provenance:target".'
          },
          intent: {
            type: 'string',
            description: 'Filter by intent of the medication request, e.g., "order", "plan", "proposal". Multiple values can be comma-separated.'
          },
          patient: {
            type: 'string',
            description: 'Filter by patient ID or full reference, e.g., "Patient/12742400".'
          },
          status: {
            type: 'string',
            description: 'Filter by status of the medication request, e.g., "active", "completed", "cancelled". Multiple values can be comma-separated.'
          }
        },
        required: ['patient']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_family_member_history',
      description: 'Search for FamilyMemberHistory resources with optional filters. Returns a FHIR FamilyMemberHistory bundle.',
      parameters: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Filter by specific FamilyMemberHistory resource ID.'
          },
          patient: {
            type: 'string',
            description: 'Filter by patient ID or reference, e.g., "Patient/12345".'
          },
          relationship: {
            type: 'string',
            description: 'Filter by family member relationship, e.g., "mother", "father", "sibling".'
          },
          status: {
            type: 'string',
            description: 'Filter by the record status, e.g., "partial", "completed", "entered-in-error", "health-unknown".'
          },
          date: {
            type: 'string',
            description: 'Filter by the date the history was taken or last updated, e.g., "ge2020-01-01".'
          },
          sex: {
            type: 'string',
            description: 'Filter by the family member’s sex, e.g., "male", "female", "other", or "unknown".'
          },
          _count: {
            type: 'integer',
            description: 'Maximum number of FamilyMemberHistory records to return.'
          },
          _include: {
            type: 'string',
            description: 'Include related resources in the response, e.g., "Patient".'
          },
          _revinclude: {
            type: 'string',
            description: 'Include reverse-linked resources, e.g., "Provenance:target".'
          },
          _sort: {
            type: 'string',
            description: 'Sort results by a field, e.g., "date".'
          },
          _page: {
            type: 'string',
            description: 'Specify the page of results to return for paginated responses.'
          }
        },
        required: ['patient']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_immunizations',
      description: 'Search for Immunization resources with optional filters. Returns a FHIR Immunization bundle.',
      parameters: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'Filter by specific Immunization resource ID.'
          },
          patient: {
            type: 'string',
            description: 'Filter by patient ID or reference, e.g., "Patient/12345".'
          },
          status: {
            type: 'string',
            description: 'Filter by the immunization status, e.g., "completed", "entered-in-error", "not-done".'
          },
          vaccineCode: {
            type: 'string',
            description: 'Filter by the vaccine code administered, e.g., "Influenza", "COVID-19".'
          },
          date: {
            type: 'string',
            description: 'Filter by the immunization date or date range, e.g., "ge2020-01-01".'
          },
          targetDisease: {
            type: 'string',
            description: 'Filter by the target disease for the vaccine, e.g., "COVID-19", "Influenza".'
          },
          lotNumber: {
            type: 'string',
            description: 'Filter by vaccine lot number if applicable.'
          },
          manufacturer: {
            type: 'string',
            description: 'Filter by vaccine manufacturer reference, e.g., "Organization/9876".'
          },
          _count: {
            type: 'integer',
            description: 'Maximum number of Immunization records to return.'
          },
          _include: {
            type: 'string',
            description: 'Include related resources in the response, e.g., "Patient", "Practitioner".'
          },
          _revinclude: {
            type: 'string',
            description: 'Include reverse-linked resources, e.g., "Provenance:target".'
          },
          _sort: {
            type: 'string',
            description: 'Sort results by a field, e.g., "date".'
          },
          _page: {
            type: 'string',
            description: 'Specify the page of results to return for paginated responses.'
          }
        },
        required: ['patient']
      }
    },

  },
  {
    type: "function",
    function: {
      name: "get_persons",
      description: "Search for Person resources with optional filters. Returns a FHIR Person bundle.",
      parameters: {
        type: "object",
        properties: {
          _id: { type: "string", description: "Filter by specific Person resource ID." },
          identifier: { type: "string", description: "Person identifier; include system|value, e.g. 'urn:oid:2.16.840.1.113883.6.1000|31577'." },
          name: { type: "string", description: "Search by person name." },
          gender: { type: "string", description: "male | female | other | unknown" },
          birthdate: { type: "string", description: "Birth date filter, e.g., 'ge2020-01-01'." },
          _count: { type: "integer", description: "Maximum number of Person records to return." },
          _include: { type: "string", description: "Include related resources." },
          _revinclude: { type: "string", description: "Include reverse-linked resources." },
          _page: { type: "string", description: "Page token for paginated responses." }
        },
        required: ["_id"] // the docs say _id required if identifier not used; choose identifier as required for typical queries
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_procedures",
      description: "Search for Procedure resources with optional filters. Returns a FHIR Procedure bundle.",
      parameters: {
        type: "object",
        properties: {
          _id: { type: "string", description: "Specific Procedure resource ID." },
          patient: { type: "string", description: "Patient ID (required if _id/subject not used)." },
          subject: { type: "string", description: "Subject reference (e.g., 'Patient/12345')." },
          date: { type: "string", description: "Date range for performedDateTime / performedPeriod." },
          _lastUpdated: { type: "string", description: "Filter by lastUpdated timestamp (can't be used with date)." },
          category: { type: "string" },
          code: { type: "string" },
          _revinclude: { type: "string" },
          _count: { type: "integer" },
          _include: { type: "string" },
          _sort: { type: "string" },
          _page: { type: "string" }
        },
        required: ["patient"]
      }
    }
  }
];

export const chatRouter = Router();

// Require client API key role. Basic auth is required when LLM calls MCP tools internally.
chatRouter.use(apiKeyRole);

chatRouter.post('/', requireRole(['Doctor', 'Admin']), async (req, res) => {
  const { messages, conversationId } = req.body as {
    messages: Array<{ role: string; content: string }>,
    conversationId?: string
  };

  const accessToken: string = req.body.token;

  if (!messages || !Array.isArray(messages))
    return res.status(400).json({ error: 'messages required' });

  try {
    // Initialize Azure OpenAI client
    const client = getOpenAIClient();
    console.log('Azure OpenAI initialized for chat processing');

    let convo = normalizeMessagesForAzure(messages.slice());
    const convId = conversationId || `${req.ip || 'anon'}:${Date.now()}`;
    const memory: ConversationMemory = memoryStore.get(convId) || {};


    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT!,
      messages: convo as any,
      tools: tools as any,
      tool_choice: 'auto',
      max_tokens: 2048
    });

    const choice: any = response.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;
    const toolCall = toolCalls?.[0];

    console.log('OpenAI Response:', {
      choice: !!choice,
      choiceMessage: !!choice?.message,
      toolCalls: toolCalls?.length || 0,
      toolCall: !!toolCall
    });

    // If no tool call is needed, return final LLM message
    if (!toolCall) {
      return res.json({
        message: choice?.message || {
          role: 'assistant',
          content: 'Chat processed successfully with Azure OpenAI.'
        }
      });
    }

    // If tool call exists, send to MCP
    const toolName = toolCall.function.name as string;
    const toolArgs = {
      ...JSON.parse(toolCall.function.arguments || '{}'),
      token: accessToken
    };

    // ✅ Validate tool arguments before proceeding
    const validation = validateToolInput(tools, toolName, toolArgs);
    if (!validation.valid) {
      return res.json({
        descriptions: validation.message
      });
    }

    // Enrich arguments with conversation memory when missing

    const endpoint = new URL(`/mcp/${toolName}`, `${req.protocol}://${req.get('host')}`);
    const toolRes = await fetch(endpoint.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.MCP_BASIC_USER}:${process.env.MCP_BASIC_PASSWORD}`).toString('base64'),
        'x-api-key': req.headers['x-api-key'] as string
      },
      body: JSON.stringify(toolArgs)
    });

    const toolJson: any = await toolRes.json();



    // Handle tool call success or failure
    if (toolRes.status !== 200) {
      req.log.error({ toolName, status: toolRes.status, response: toolJson }, 'MCP tool call failed');
      return res.status(500).json({ error: 'Tool call failed', tool: toolName, details: toolJson });
    }

    if (toolJson.count == 0) {
      return res.json({
        descriptions: "No record(s) found for the given criteria"
      });
    }

    // Update conversation memory for allergies and patients
    try {
      if (toolName === 'get_allergy_intolerances') {
        const bundle = toolJson as any;
        if (bundle?.resourceType === 'Bundle' && bundle.entry?.length > 0) {
          const firstEntry = bundle.entry[0];
          if (firstEntry?.resource?.id) memory.lastAllergyId = String(firstEntry.resource.id);
          const patientRef = firstEntry?.resource?.patient?.reference || '';
          const patientId = patientRef.startsWith('Patient/') ? patientRef.split('/')[1] : undefined;
          if (patientId) memory.lastPatientId = patientId;
        }
        memoryStore.set(convId, { ...memory });
        return res.json({
          descriptions: bundle.descriptions,
          count: bundle.descriptions.length
        });
      }

      if (toolName === 'get_patients') {
        const bundle = toolJson as any;

        if (bundle?.resourceType === 'Bundle' && bundle.entry?.length > 0) {
          // Store last patient ID in memory
          const firstEntry = bundle.entry[0];
          if (firstEntry?.resource?.id) memory.lastPatientId = String(firstEntry.resource.id);
        }

        // Persist memory
        memoryStore.set(convId, { ...memory });

        // Extract patient details from bundle
        const patients = bundle.patients?.map((p: any) => ({
          description: `${p.id} - ${p.name}`,
        })) || [];

        return res.json({
          descriptions: patients.map((p: any) => p.description), // <-- extract description strings
          count: patients.length
        });
      }

      if (toolName === 'get_medication_requests') {
        const bundle = toolJson as any;

        if (bundle?.resourceType === 'Bundle' && bundle.entry?.length > 0) {
          // Store last MedicationRequest ID in memory
          const firstEntry = bundle.entry[0];
          if (firstEntry?.resource?.id) {
            memory.lastMedicationRequestId = String(firstEntry.resource.id);
          }
        }

        // Persist memory
        memoryStore.set(convId, { ...memory });

        // Extract medication request details from the bundle
        const medicationRequests = bundle.medicationRequests?.map((p: any) => ({
          description: `${p.medication}`,
        })) || [];

        return res.json({
          descriptions: medicationRequests.map((m: any) => m.description),
          count: medicationRequests.length
        });
      }

      if (toolName === 'get_family_member_history') {
        const bundle = toolJson as any;

        if (bundle?.resourceType === 'Bundle' && bundle.entry?.length > 0) {
          // Store last FamilyMemberHistory ID in memory
          const firstEntry = bundle.entry[0];
          if (firstEntry?.resource?.id) {
            memory.lastFamilyMemberHistoryId = String(firstEntry.resource.id);
          }
        }

        // Persist memory
        memoryStore.set(convId, { ...memory });

        // Extract family member history details from the bundle
        const familyHistories =
          bundle.familyMemberHistories
            ?.filter((f: any) => Array.isArray(f.conditions) && f.conditions.length > 0)
            .map((f: any) => {
              // Each condition may already be formatted as "Hypertension - Negative"
              const conditionDescriptions = f.conditions.join(', ');
              return {
                description: `${f.relationship} - ${conditionDescriptions}`,
              };
            }) || [];

        return res.json({
          descriptions: familyHistories.map((f: any) => f.description),
          count: familyHistories.length
        });
      }

      if (toolName === 'get_immunizations') {
        const bundle = toolJson as any;

        if (bundle?.resourceType === 'Bundle' && bundle.entry?.length > 0) {
          const firstEntry = bundle.entry[0];
          if (firstEntry?.resource?.id) {
            memory.lastImmunizationId = String(firstEntry.resource.id);
          }
        }

        memoryStore.set(convId, { ...memory });

        const immunizationSummaries = bundle.entry?.map((entry: any) => {
          const resource = entry.resource;
          if (!resource || resource.resourceType !== "Immunization") return null;

          return {
            id: resource.id,
            vaccine: resource.vaccineCode?.text || resource.vaccineCode?.coding?.[0]?.display || "",
            status: resource.status || "",
            date: resource.occurrenceDateTime || "",
            patient: resource.patient?.reference || "",
            targetDisease: resource.targetDisease?.[0]?.coding?.[0]?.display || ""
          };
        }).filter(Boolean) as Array<any>;

        return res.json({
          descriptions: immunizationSummaries.map(i => `${i.vaccine} (target: ${i.targetDisease}) on ${i.date} – Status: ${i.status}`),
          count: immunizationSummaries.length
        });
      }

      // inside your existing tool-response handler
      if (toolName === "get_persons") {
        const bundle = toolJson as any;

        if (bundle?.resourceType === "Bundle" && bundle.entry?.length > 0) {
          const firstEntry = bundle.entry[0];
          if (firstEntry?.resource?.id) {
            memory.lastPersonId = String(firstEntry.resource.id);
          }
        }

        memoryStore.set(convId, { ...memory });

        const persons = bundle.entry?.map((entry: any) => {
          const r = entry.resource;
          if (!r || r.resourceType !== "Person") return null;
          const name = r.name?.[0]?.text ||
            (r.name?.[0] ? `${r.name?.[0].given?.join(" ") || ""} ${r.name?.[0].family || ""}`.trim() : "Unknown");
          return {
            description: `${name} — ${r.gender || "unknown"} — DOB: ${r.birthDate || "n/a"}`
          };
        }).filter(Boolean) || [];

        return res.json({
          descriptions: persons.map((p: any) => p.description),
          count: persons.length
        });
      }

      if (toolName === "get_procedures") {
        const bundle = toolJson as any;

        if (bundle?.resourceType === "Bundle" && bundle.entry?.length > 0) {
          const firstEntry = bundle.entry[0];
          if (firstEntry?.resource?.id) {
            memory.lastProcedureId = String(firstEntry.resource.id);
          }
        }

        memoryStore.set(convId, { ...memory });

        const procedureSummaries =
          bundle.procedures
            ?.filter((p: any) => p.performed) // ✅ Only include if 'performed' exists
            .map((p: any) => {
              const formattedDate = formatDate(p.performed);
              return {
                description: `${p.code} - ${p.status} - ${formattedDate}`,
              };
            }) || [];
        return res.json({
          descriptions: procedureSummaries.map((p: any) => p.description),
          count: procedureSummaries.length
        });
      }




    } catch { }

    // Return the actual tool response JSON
    return res.json(toolJson);
    // Should never reach here
    //return res.json({ message: "No further response" });

  } catch (err: any) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Chat failed', message: err?.message || 'Unknown error' });
  }
});





// Helper to create human-readable summaries
function getSummary(toolName: string, result: any): string {
  switch (toolName) {
    case 'get_allergy_intolerances':
      if (result.resourceType === 'Bundle' && result.entry) {
        return `Found ${result.entry.length} allergy intolerance(s)`;
      }
      return 'Retrieved allergy intolerance bundle';
    case 'get_patients':
      if (result.resourceType === 'Bundle' && result.entry) {
        return `Found ${result.entry.length} patient(s)`;
      }
      return 'Retrieved patient bundle';
    default:
      return 'Completed';
  }
}

function validateToolInput(
  tools: any[],
  toolName: string,
  args: Record<string, any>
): { valid: boolean; message?: string } {
  const tool = tools.find(t => t.function.name === toolName);
  if (!tool) {
    return { valid: false, message: `Unknown tool: ${toolName}` };
  }

  const required: string[] = tool.function.parameters.required || [];
  const missing = required.filter((field: string) => args[field] === undefined || args[field] === '');

  if (toolName === 'get_patients' && !args.name && !args._id) {
    return {
      valid: false,
      message: 'Please provide either "name" or "_id" to search for patients.'
    };
  }

  if (toolName === 'get_allergy_intolerances' && !args.patient && !args._id) {
    return {
      valid: false,
      message: 'Please provide either "patient Id" or "allergy Id" to search for allergy intolerances.'
    };
  }

  if (toolName === 'get_medication_requests' && !args.patient) {
    return {
      valid: false,
      message: 'Please provide  "patient Id" to search for medication requests.'
    };
  }
  return { valid: true };
}

function normalizeMessagesForAzure(messages: any[]) {
  return messages.map((m) => {
    // If content is an array (new OpenAI API format)
    if (Array.isArray(m.content)) {
      const textContent = m.content
        .map((c: any) => (typeof c === "string" ? c : c?.text || ""))
        .join("\n");
      return { ...m, content: textContent };
    }

    // If content is an object (e.g. { type: 'text', text: '...' })
    if (typeof m.content === "object" && m.content?.text) {
      return { ...m, content: m.content.text };
    }

    // If content is already a string, keep as-is
    return m;
  });
}

function formatDate(date: string | Date): string {
  const d = new Date(date);

  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const hours = String(d.getUTCHours()).padStart(2, "0");
  const minutes = String(d.getUTCMinutes()).padStart(2, "0");
  const seconds = String(d.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

