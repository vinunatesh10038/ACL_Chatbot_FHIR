import { logger } from '../logger';

type AuditEntry = {
  timestamp: string;
  userRole: string;
  tool: string;
  args: unknown;
  status: number;
  responseSample?: unknown;
};

export function writeAudit(entry: AuditEntry) {
  // Only include a small sample of the response for privacy
  const sample = typeof entry.responseSample === 'string'
    ? entry.responseSample.slice(0, 500)
    : entry.responseSample;
  logger.info({ audit: { ...entry, responseSample: sample } }, 'mcp_tool_call');
}
