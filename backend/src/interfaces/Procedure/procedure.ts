// types/fhir.procedure.ts
export interface Bundle<T> {
  resourceType: "Bundle";
  id?: string;
  type?: string;
  total?: number;
  link?: Array<{ relation: string; url: string }>;
  entry?: Array<{ fullUrl?: string; resource: T }>;
}

export interface Coding { system?: string; code?: string; display?: string; userSelected?: boolean }
export interface CodeableConcept { coding?: Coding[]; text?: string }
export interface Reference { reference?: string; type?: string; display?: string }
export interface Identifier { use?: string; system?: string; value?: string; type?: CodeableConcept }
export interface Annotation { authorReference?: Reference; authorString?: string; time?: string; text?: string }

export interface ProcedurePerformer {
  actor: Reference;
  role?: CodeableConcept;
}

export interface Procedure {
  resourceType: "Procedure";
  id?: string;
  meta?: { versionId?: string; lastUpdated?: string; [k: string]: any };
  text?: { status?: string; div?: string };
  identifier?: Identifier[];
  status?: string; // e.g., completed, in-progress, etc.
  category?: CodeableConcept;
  code?: CodeableConcept;
  subject?: Reference; // who procedure is for (Patient)
  patient?: Reference; // sometimes used
  encounter?: Reference;
  performedDateTime?: string;
  performedPeriod?: { start?: string; end?: string; [k: string]: any };
  recorder?: Reference;
  performer?: ProcedurePerformer[];
  location?: Reference;
  reasonCode?: CodeableConcept[];
  bodySite?: CodeableConcept[];
  outcome?: CodeableConcept;
  complication?: CodeableConcept[];
  note?: Annotation[];
  [k: string]: any;
}
