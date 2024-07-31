"use client";

import { Configuration, DefaultApi } from "@/api-client";

// function to get the API url
export function getApiUrl() {
    // For the link below you can also use "http://0.0.0.0:8000"
  return process.env.NEXT_PUBLIC_API_BASE_URL || "https://bpve3nbtfqav4lskuxeeperrzq0qdgki.lambda-url.us-east-1.on.aws/openapi.json";
}

export default function createApiClient() {
  const apiConfig = new Configuration({
    basePath: getApiUrl(),
  });
  const api = new DefaultApi(apiConfig);
  return api;
}