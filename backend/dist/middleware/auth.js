"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.basicAuth = basicAuth;
exports.apiKeyRole = apiKeyRole;
exports.requireRole = requireRole;
function basicAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic '))
        return res.status(401).set('WWW-Authenticate', 'Basic').end();
    const decoded = Buffer.from(auth.slice(6), 'base64').toString();
    const [user, pass] = decoded.split(':');
    if (user === process.env.MCP_BASIC_USER && pass === process.env.MCP_BASIC_PASSWORD)
        return next();
    return res.status(401).end();
}
function apiKeyRole(req, res, next) {
    const key = req.headers['x-api-key'];
    if (!key || typeof key !== 'string')
        return res.status(401).json({ error: 'Missing API key' });
    if (key === process.env.ADMIN_API_KEY) {
        req.user = { role: 'Admin' };
        return next();
    }
    if (key === process.env.DOCTOR_API_KEY) {
        req.user = { role: 'Doctor' };
        return next();
    }
    return res.status(403).json({ error: 'Invalid API key' });
}
function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).end();
        if (!roles.includes(req.user.role))
            return res.status(403).end();
        return next();
    };
}
