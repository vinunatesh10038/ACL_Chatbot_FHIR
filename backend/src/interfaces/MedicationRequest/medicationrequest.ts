// Request parameters for GET /MedicationRequest
export interface MedicationRequestQueryParams {
  "-timing-boundsPeriod"?: string;  // e.g. "ge2014-05-19T20:54:02.000Z" :contentReference[oaicite:1]{index=1}
  _count?: number;
  _id?: string;
  _lastUpdated?: string;              // e.g. "ge2014-05-19T20:54:02.000Z" or combinations :contentReference[oaicite:2]{index=2}
  _revinclude?: string;              // e.g. "Provenance:target" :contentReference[oaicite:3]{index=3}
  intent?: string;                   // e.g. “order,plan” :contentReference[oaicite:4]{index=4}
  patient?: string;                  // patient id :contentReference[oaicite:5]{index=5}
  status?: string;                   // e.g. “active,completed” :contentReference[oaicite:6]{index=6}
}

// FHIR types (simplified) for MedicationRequest resource inside the response
export interface Coding {
  system?: string;
  code?: string;
  display?: string;
  userSelected?: boolean;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Reference {
  reference?: string;   // e.g. "Patient/12724066"
  display?: string;
}

// For dosageInstruction.repeat.boundsPeriod
export interface Period {
  start?: string;
  end?: string;
}

export interface TimingRepeat {
  boundsPeriod?: Period;
  // other fields (frequency, period, etc) omitted for brevity
}

export interface Timing {
  repeat?: TimingRepeat;
  code?: CodeableConcept;
}

// MedicationRequest resource (simplified)
export interface MedicationRequestResource {
  resourceType: "MedicationRequest";
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
  text?: {
    status?: string;
    div?: string;
  };
  status?: string;
  intent?: string;
  category?: CodeableConcept[];
  reportedBoolean?: boolean;
  medicationCodeableConcept?: CodeableConcept;
  medicationReference?: Reference;
  subject?: Reference;
  encounter?: Reference;
  authoredOn?: string;
  requester?: Reference;
  courseOfTherapyType?: CodeableConcept;
  reasonCode?: CodeableConcept[];
  dosageInstruction?: Array<{
    extension?: any[];              // extension details omitted
    text?: string;
    patientInstruction?: string;
    timing?: Timing;
    route?: CodeableConcept;
    method?: CodeableConcept;
    doseAndRate?: Array<{
      doseQuantity?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
      rateQuantity?: {
        value?: number;
        unit?: string;
        system?: string;
        code?: string;
      };
    }>;
  }>;
  dispenseRequest?: {
    validityPeriod?: Period;
    quantity?: {
      value?: number;
      unit?: string;
      system?: string;
      code?: string;
    };
    numberOfRepeatsAllowed?: number;
  };
  // other fields omitted for brevity
}

export interface BundleLink {
  relation: string;
  url: string;
}

export interface BundleEntry {
  fullUrl?: string;
  resource?: MedicationRequestResource | any;  // might include Provenance etc if _revinclude used
  search?: {
    mode?: string;
  };
}

export interface MedicationRequestBundle {
  resourceType: "Bundle";
  id?: string;
  type?: string;
  total?: number;
  link?: BundleLink[];
  entry?: BundleEntry[];
}
