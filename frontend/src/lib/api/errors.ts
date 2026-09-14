import axios from "axios";
import type { ApiErrorResponse } from "@/types/api";

export function isApiError(data: unknown): data is ApiErrorResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "status" in data &&
    ("message" in data || "data" in data)
  );
}

export function messageFrom(data: unknown): string {
  if (isApiError(data)) {
    const message = data.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string" && message.length > 0) return message;
  }
  return "The registry returned an unexpected response.";
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data) return messageFrom(data);
    if (error.code === "ERR_NETWORK") {
      return "Could not reach the registry. Is the API running?";
    }
    return error.message || "Request failed.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}