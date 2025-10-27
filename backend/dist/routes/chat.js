"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const openai_1 = require("../azure/openai");
const memoryStore = new Map();
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
    }
];
exports.chatRouter = (0, express_1.Router)();
// Require client API key role. Basic auth is required when LLM calls MCP tools internally.
exports.chatRouter.use(auth_1.apiKeyRole);
exports.chatRouter.post('/', (0, auth_1.requireRole)(['Doctor', 'Admin']), async (req, res) => {
    const { messages, conversationId } = req.body;
    const accessToken = req.body.token;
    if (!messages || !Array.isArray(messages))
        return res.status(400).json({ error: 'messages required' });
    try {
        // Initialize Azure OpenAI client
        const client = (0, openai_1.getOpenAIClient)();
        console.log('Azure OpenAI initialized for chat processing');
        let convo = normalizeMessagesForAzure(messages.slice());
        const convId = conversationId || `${req.ip || 'anon'}:${Date.now()}`;
        const memory = memoryStore.get(convId) || {};
        const response = await client.chat.completions.create({
            model: process.env.AZURE_OPENAI_DEPLOYMENT,
            messages: convo,
            tools: tools,
            tool_choice: 'auto',
            max_tokens: 2048
        });
        const choice = response.choices?.[0];
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
        const toolName = toolCall.function.name;
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
                'x-api-key': req.headers['x-api-key']
            },
            body: JSON.stringify(toolArgs)
        });
        const toolJson = await toolRes.json();
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
                const bundle = toolJson;
                if (bundle?.resourceType === 'Bundle' && bundle.entry?.length > 0) {
                    const firstEntry = bundle.entry[0];
                    if (firstEntry?.resource?.id)
                        memory.lastAllergyId = String(firstEntry.resource.id);
                    const patientRef = firstEntry?.resource?.patient?.reference || '';
                    const patientId = patientRef.startsWith('Patient/') ? patientRef.split('/')[1] : undefined;
                    if (patientId)
                        memory.lastPatientId = patientId;
                }
                memoryStore.set(convId, { ...memory });
                return res.json({
                    descriptions: bundle.descriptions,
                    count: bundle.descriptions.length
                });
            }
            if (toolName === 'get_patients') {
                const bundle = toolJson;
                if (bundle?.resourceType === 'Bundle' && bundle.entry?.length > 0) {
                    // Store last patient ID in memory
                    const firstEntry = bundle.entry[0];
                    if (firstEntry?.resource?.id)
                        memory.lastPatientId = String(firstEntry.resource.id);
                }
                // Persist memory
                memoryStore.set(convId, { ...memory });
                // Extract patient details from bundle
                const patients = bundle.patients?.map((p) => ({
                    description: `${p.id} - ${p.name}`,
                })) || [];
                return res.json({
                    descriptions: patients.map((p) => p.description), // <-- extract description strings
                    count: patients.length
                });
            }
            if (toolName === 'get_medication_requests') {
                const bundle = toolJson;
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
                const medicationRequests = bundle.medicationRequests?.map((p) => ({
                    description: `${p.medication}`,
                })) || [];
                return res.json({
                    descriptions: medicationRequests.map((m) => m.description),
                    count: medicationRequests.length
                });
            }
        }
        catch { }
        // Return the actual tool response JSON
        return res.json(toolJson);
        // Should never reach here
        //return res.json({ message: "No further response" });
    }
    catch (err) {
        console.error('Chat error:', err);
        return res.status(500).json({ error: 'Chat failed', message: err?.message || 'Unknown error' });
    }
});
// Helper to create human-readable summaries
function getSummary(toolName, result) {
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
function validateToolInput(tools, toolName, args) {
    const tool = tools.find(t => t.function.name === toolName);
    if (!tool) {
        return { valid: false, message: `Unknown tool: ${toolName}` };
    }
    const required = tool.function.parameters.required || [];
    const missing = required.filter((field) => args[field] === undefined || args[field] === '');
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
function normalizeMessagesForAzure(messages) {
    return messages.map((m) => {
        // If content is an array (new OpenAI API format)
        if (Array.isArray(m.content)) {
            const textContent = m.content
                .map((c) => (typeof c === "string" ? c : c?.text || ""))
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
