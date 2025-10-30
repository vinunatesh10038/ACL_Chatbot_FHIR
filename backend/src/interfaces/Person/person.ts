// types/fhir.person.ts

export interface Bundle<T> {
  resourceType: "Bundle";
  id?: string;
  type?: string;
  total?: number;
  link?: Array<{ relation: string; url: string }>;
  entry?: Array<{
    fullUrl?: string;
    resource: T;
  }>;
}

/* common FHIR helper types */
export interface Coding { system?: string; code?: string; display?: string; }
export interface CodeableConcept { coding?: Coding[]; text?: string; }
export interface Reference { reference?: string; type?: string; display?: string; }
export interface Identifier { use?: string; system?: string; value?: string; type?: CodeableConcept; }
export interface HumanName { use?: string; text?: string; family?: string; given?: string[]; prefix?: string[]; suffix?: string[]; period?: any; }
export interface ContactPoint { system?: string; value?: string; use?: string; rank?: number; period?: any; }
export interface Address { use?: string; type?: string; text?: string; line?: string[]; city?: string; district?: string; state?: string; postalCode?: string; country?: string; period?: any; }

/* Person resource (simplified, covers fields shown in docs) */
export interface Person {
  resourceType: "Person";
  id?: string;
  meta?: { versionId?: string; lastUpdated?: string; [k: string]: any };
  text?: { status?: string; div?: string };
  identifier?: Identifier[];
  name?: HumanName[];
  telecom?: ContactPoint[];
  gender?: string;
  birthDate?: string;
  address?: Address[];
  active?: boolean;
  [k: string]: any; // allow additional FHIR fields if present
}
