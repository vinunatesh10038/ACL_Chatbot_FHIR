"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokenFromEnv = getTokenFromEnv;
exports.getTokenForCerner = getTokenForCerner;
const axios_1 = __importDefault(require("axios"));
async function getTokenFromEnv() {
    const tenantId = process.env.TENANT_ID;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default'
    });
    const response = await axios_1.default.post(tokenUrl, params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    return response.data;
}
async function getTokenForCerner() {
    const clientId = process.env.CERNER_CLIENT_ID;
    const clientSecret = process.env.CERNER_CLIENT_SECRET;
    const tokenUrl = process.env.CERNER_TOKEN_URL || 'https://api.cerner.com/oauth2/token';
    const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'patient/AllergyIntolerance.read patient/AllergyIntolerance.write'
    });
    const response = await axios_1.default.post(tokenUrl, params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    return response.data;
}
