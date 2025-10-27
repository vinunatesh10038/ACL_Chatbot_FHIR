"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiVersion = exports.deployment = void 0;
exports.getOpenAIClient = getOpenAIClient;
const openai_1 = __importDefault(require("openai"));
function getOpenAIClient() {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const baseURL = process.env.AZURE_OPENAI_ENDPOINT;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    if (!apiKey || !baseURL || !apiVersion) {
        throw new Error("Missing Azure OpenAI configuration. Required: AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_VERSION");
    }
    // Remove trailing slash from base URL
    const cleanBaseURL = baseURL.replace(/\/$/, "");
    console.log("Azure OpenAI Config:", {
        baseURL: `${cleanBaseURL}/openai/deployments/${deployment}`,
        deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
        apiVersion
    });
    return new openai_1.default({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
        defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
        defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION },
    });
}
exports.deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
exports.apiVersion = process.env.AZURE_OPENAI_API_VERSION;
