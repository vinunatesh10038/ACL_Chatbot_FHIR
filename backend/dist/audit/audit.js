"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAudit = writeAudit;
const logger_1 = require("../logger");
function writeAudit(entry) {
    // Only include a small sample of the response for privacy
    const sample = typeof entry.responseSample === 'string'
        ? entry.responseSample.slice(0, 500)
        : entry.responseSample;
    logger_1.logger.info({ audit: { ...entry, responseSample: sample } }, 'mcp_tool_call');
}
