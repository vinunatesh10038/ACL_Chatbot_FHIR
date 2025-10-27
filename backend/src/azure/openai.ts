import OpenAI from "openai";

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.AZURE_OPENAI_API_KEY as string;
  const baseURL = process.env.AZURE_OPENAI_ENDPOINT as string;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION as string;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT as string;

  if (!apiKey || !baseURL || !apiVersion) {
    throw new Error(
      "Missing Azure OpenAI configuration. Required: AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_VERSION"
    );
  }

  // Remove trailing slash from base URL
  const cleanBaseURL = baseURL.replace(/\/$/, "");

  console.log("Azure OpenAI Config:", {
    baseURL: `${cleanBaseURL}/openai/deployments/${deployment}`,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT,
    apiVersion
  });

  return new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY!,
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
    defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY! },
    defaultQuery: { "api-version": process.env.AZURE_OPENAI_API_VERSION! },
  });
}
export const deployment = process.env.AZURE_OPENAI_DEPLOYMENT as string;
export const apiVersion = process.env.AZURE_OPENAI_API_VERSION as string;
