# AllergyIntolerance FHIR Client

A TypeScript client for consuming FHIR R4 AllergyIntolerance endpoints, based on the Oracle Millennium Platform API documentation.

## Features

- ✅ Axios-based HTTP client for FHIR GET requests
- ✅ Environment variable configuration (`process.env.FHIR_BASE_URL`)
- ✅ Bearer token authentication
- ✅ Comprehensive TypeScript interfaces for FHIR R4 AllergyIntolerance
- ✅ Structured success/error response handling
- ✅ Clean JSON logging for both success and error responses
- ✅ Modular design for reuse with other FHIR endpoints
- ✅ Support for all AllergyIntolerance search parameters
- ✅ Pagination support

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env` file:
```env
# FHIR Configuration
FHIR_BASE_URL=https://your-fhir-server.com/fhir/r4
FHIR_ACCESS_TOKEN=your-bearer-token-here

# Environment
NODE_ENV=development
```

3. Build the project:
```bash
npm run build
```

## Usage

### Basic Usage

```typescript
import AllergyIntoleranceClient from './allergy-intolerance-client';

// Get all active allergies for a patient
const response = await AllergyIntoleranceClient.getAllergyIntolerances({
  patient: 'Patient/12345',
  clinicalstatus: 'active',
  _count: 10
});

if (response.success) {
  console.log(`Retrieved ${response.metadata.totalResults} allergies`);
  const allergies = response.data.entry?.map(entry => entry.resource) || [];
  // Process allergies
} else {
  console.error('Error:', response.error.message);
}
```

### Search Parameters

All supported FHIR search parameters for AllergyIntolerance:

```typescript
const searchParams: AllergyIntoleranceSearchParameters = {
  patient: 'Patient/12345',              // Patient ID filter
  clinicalstatus: 'active',              // Clinical status
  verificationstatus: 'confirmed',       // Verification status
  type: 'allergy',                       // Allergy or intolerance
  category: 'medication',                // Category filter
  criticality: 'high',                   // Criticality level
  onset: 'ge2020-01-01',                 // Onset date range
  recordeddate: 'le2024-12-31',          // Recorded date range
  asserter: 'Practitioner/67890',        // Asserter ID
  _count: 50                             // Results limit
};
```

### Pagination

The client supports automatic pagination through response links:

```typescript
let response = await AllergyIntoleranceClient.getAllergyIntolerances({ ...params });

// Get next page if available
if (response.success && response.metadata.hasNextPage) {
  const nextResponse = await AllergyIntoleranceClient.getNextPage(response);
}
```

### Response Structure

#### Success Response
```typescript
{
  success: true,
  data: AllergyIntoleranceResponse,  // Complete FHIR Bundle
  metadata: {
    requestId: string,
    timestamp: string,
    url: string,
    requestTime: number,
    totalResults?: number,
    hasNextPage?: boolean
  }
}
```

#### Error Response
```typescript
{
  success: false,
  error: {
    message: string,
    code: string,
    details?: any
  },
  metadata: {
    requestId: string,
    timestamp: string,
    url: string,
    requestTime: number,
    statusCode?: number
  }
}
```

## Testing

Run the example test:

```bash
npx ts-node allergy-intolerance-client.ts
```

This will demonstrate the client with sample parameters. Update the `.env` file with real FHIR server credentials to test against a live endpoint.

## Expected Log Output

Success logs follow structured JSON format:
```json
{
  "level": 30,
  "time": "2025-10-16T14:24:41.943Z",
  "pid": 12345,
  "hostname": "localhost",
  "msg": "FHIR AllergyIntolerance search completed successfully",
  "requestId": "req_1760624681943_abc123",
  "url": "https://example.com/fhir/r4/AllergyIntolerance?...",
  "status": 200,
  "totalResults": 5,
  "requestTime": 250,
  "queryParams": { ... }
}
```

Error logs follow similar structure with error details included.

## Environment Variables

- `FHIR_BASE_URL`: Base URL of your FHIR server (required)
- `FHIR_ACCESS_TOKEN`: Bearer token for authentication (required)

## FHIR Compliance

This client implements the FHIR R4 AllergyIntolerance resource specification and follows Oracle Millennium Platform API documentation for the GET endpoint operations.
