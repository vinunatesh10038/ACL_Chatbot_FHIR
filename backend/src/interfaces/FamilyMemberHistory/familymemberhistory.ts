// fhir.types.ts

export interface Coding {
  system?: string;
  code?: string;
  display?: string;
}

export interface CodeableConcept {
  coding?: Coding[];
  text?: string;
}

export interface Reference {
  reference?: string;
  display?: string;
}

export interface Meta {
  versionId?: string;
  lastUpdated?: string;
  [key: string]: any;
}

export interface Narrative {
  status?: string;
  div?: string;
}

export interface Extension {
  url: string;
  valueCodeableConcept?: CodeableConcept;
  [key: string]: any;
}

export interface FamilyMemberHistoryCondition {
  code?: CodeableConcept;
  outcome?: CodeableConcept;
  contributedToDeath?: boolean;
  onsetAge?: any;        // can refine: Age | Range | string
  onsetRange?: any;
  onsetString?: string;
  note?: Annotation[];
  [key: string]: any;
}

export interface Annotation {
  authorReference?: Reference;
  authorString?: string;
  time?: string;
  text: string;
}

export interface FamilyMemberHistory {
  resourceType: "FamilyMemberHistory";
  id?: string;
  meta?: Meta;
  implicitRules?: string;
  language?: string;
  text?: Narrative;
  contained?: any[];
  extension?: Extension[];
  modifierExtension?: Extension[];

  identifier?: any[];      // simplify
  status: string;
  dataAbsentReason?: CodeableConcept;
  patient: Reference;
  date?: string;
  recorder?: Reference;
  asserter?: Reference;
  name?: string;
  relationship: CodeableConcept;
  sex?: CodeableConcept;
  bornDate?: string;
  bornPeriod?: any;
  ageAge?: any;
  ageRange?: any;
  ageString?: string;
  estimatedAge?: boolean;
  deceasedBoolean?: boolean;
  deceasedAge?: any;
  deceasedRange?: any;
  deceasedDate?: string;
  reasonCode?: CodeableConcept[];
  reasonReference?: Reference[];
  note?: Annotation[];
  condition?: FamilyMemberHistoryCondition[];
  procedure?: any[];
  [key: string]: any;
}

export interface BundleLink {
  relation: string;
  url: string;
}

export interface BundleEntry<T> {
  fullUrl?: string;
  resource: T;
  [key: string]: any;
}

export interface Bundle<T> {
  resourceType: "Bundle";
  id?: string;
  type?: string;
  link?: BundleLink[];
  entry?: BundleEntry<T>[];
  [key: string]: any;
}
