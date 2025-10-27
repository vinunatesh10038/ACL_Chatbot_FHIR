
export interface AllergyIntolerance {
  resourceType: "AllergyIntolerance";
  id: string;
  clinicalStatus?: { coding: { code: string; display?: string }[]; text?: string };
  verificationStatus?: { coding: { code: string; display?: string }[]; text?: string };
  type?: string;
  category?: string[];
  criticality?: string;
  code?: { coding: { code: string; display?: string }[]; text?: string };
  patient?: { reference: string; display?: string };
  onsetDateTime?: string;
  recordedDate?: string;
}

