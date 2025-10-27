export interface Patient {
  resourceType: "Patient";
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    source?: string;
    profile?: string[];
  };
  text?: {
    status?: string;
    div?: string;
  };
  identifier?: Array<{
    use?: string;
    type?: { coding?: { system?: string; code?: string; display?: string }[]; text?: string };
    system?: string;
    value?: string;
    period?: { start?: string; end?: string };
    assigner?: { display?: string; reference?: string };
  }>;
  name?: Array<{
    use?: string;
    text?: string;
    family?: string;
    given?: string[];
    prefix?: string[];
    suffix?: string[];
  }>;
  telecom?: Array<{
    system?: string; // phone, email, etc.
    value?: string;
    use?: string;
    rank?: number;
    period?: { start?: string; end?: string };
  }>;
  gender?: string; // male | female | other | unknown
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: Array<{
    use?: string;
    type?: string;
    text?: string;
    line?: string[];
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    period?: { start?: string; end?: string };
  }>;
  maritalStatus?: { coding?: { system?: string; code?: string; display?: string }[]; text?: string };
  multipleBirthBoolean?: boolean;
  multipleBirthInteger?: number;
  photo?: Array<{ contentType?: string; url?: string }>;
  contact?: Array<{
    relationship?: { coding?: { system?: string; code?: string; display?: string }[]; text?: string }[];
    name?: { family?: string; given?: string[]; prefix?: string[]; suffix?: string[] };
    telecom?: Array<{ system?: string; value?: string; use?: string }>;
    address?: { line?: string[]; city?: string; state?: string; postalCode?: string; country?: string };
    gender?: string;
    organization?: { reference?: string; display?: string };
    period?: { start?: string; end?: string };
  }>;
  communication?: Array<{
    language?: { coding?: { system?: string; code?: string; display?: string }[]; text?: string };
    preferred?: boolean;
  }>;
  generalPractitioner?: Array<{ reference?: string; display?: string }>;
  managingOrganization?: { reference?: string; display?: string };
  link?: Array<{ other?: { reference?: string; display?: string }; type?: string }>;
}

export interface Bundle<T> {
  resourceType: string;
  id?: string;
  type: string;
  total?: number;
  entry?: { resource: T; fullUrl?: string }[];
  link?: { relation: string; url: string }[];
}
