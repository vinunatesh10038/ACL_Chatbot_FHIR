export interface Bundle<T> {
  resourceType: string;
  id?: string;
  type: string;
  total?: number;
  entry?: { resource: T; fullUrl?: string }[];
  link?: { relation: string; url: string }[];
}
