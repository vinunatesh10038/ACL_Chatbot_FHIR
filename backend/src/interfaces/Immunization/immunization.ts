/**
 * Core FHIR Bundle type (generic)
 */
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

/**
 * FHIR Coding type
 */
export interface Coding {
  system?: string;
  code?: string;
  display?: string;
}

/**
 * FHIR CodeableConcept type
 */
export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

/**
 * FHIR Reference type
 */
export interface Reference {
  reference?: string; // e.g., "Patient/12345"
  type?: string;
  display?: string;
}

/**
 * FHIR Identifier type
 */
export interface Identifier {
  use?: string;
  system?: string;
  value?: string;
}

/**
 * FHIR Annotation type
 */
export interface Annotation {
  authorReference?: Reference;
  authorString?: string;
  time?: string;
  text?: string;
}

/**
 * Immunization Performer component
 */
export interface ImmunizationPerformer {
  function?: CodeableConcept;
  actor: Reference;
}

/**
 * Immunization Reaction component
 */
export interface ImmunizationReaction {
  date?: string;
  detail?: Reference;
  reported?: boolean;
}

/**
 * Immunization Protocol Applied component
 */
export interface ImmunizationProtocolApplied {
  series?: string;
  authority?: Reference;
  targetDisease?: CodeableConcept[];
  doseNumberPositiveInt?: number;
  seriesDosesPositiveInt?: number;
}

/**
 * Main Immunization resource
 */
export interface Immunization {
  resourceType: "Immunization";
  id?: string;
  identifier?: Identifier[];
  status?: string; // completed | entered-in-error | not-done
  statusReason?: CodeableConcept;
  vaccineCode?: CodeableConcept;
  patient: Reference;
  encounter?: Reference;
  occurrenceDateTime?: string;
  recorded?: string;
  primarySource?: boolean;
  reportOrigin?: CodeableConcept;
  location?: Reference;
  manufacturer?: Reference;
  lotNumber?: string;
  expirationDate?: string;
  site?: CodeableConcept;
  route?: CodeableConcept;
  doseQuantity?: {
    value?: number;
    unit?: string;
    system?: string;
    code?: string;
  };
  performer?: ImmunizationPerformer[];
  note?: Annotation[];
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  isSubpotent?: boolean;
  subpotentReason?: CodeableConcept[];
  education?: Array<{
    documentType?: string;
    reference?: string;
    publicationDate?: string;
    presentationDate?: string;
  }>;
  programEligibility?: CodeableConcept[];
  fundingSource?: CodeableConcept;
  reaction?: ImmunizationReaction[];
  protocolApplied?: ImmunizationProtocolApplied[];
}
