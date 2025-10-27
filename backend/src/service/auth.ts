import axios, { AxiosResponse } from 'axios';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export async function getTokenFromEnv(): Promise<TokenResponse> {
  const tenantId = process.env.TENANT_ID;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId!,
    client_secret: clientSecret!,
    scope: 'https://graph.microsoft.com/.default'
  });

  const response: AxiosResponse<TokenResponse> = await axios.post(tokenUrl, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return response.data;
}

export async function getTokenForCerner(): Promise<TokenResponse> {
  const clientId = process.env.CERNER_CLIENT_ID;
  const clientSecret = process.env.CERNER_CLIENT_SECRET;
  const tokenUrl = process.env.CERNER_TOKEN_URL || 'https://api.cerner.com/oauth2/token';

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId!,
    client_secret: clientSecret!,
    scope: 'patient/AllergyIntolerance.read patient/AllergyIntolerance.write'
  });

  const response: AxiosResponse<TokenResponse> = await axios.post(tokenUrl, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  return response.data;
}
