import axios from "axios";
import { CheckRequest, LinkStatus } from "./model/types";

// Dynamically determine the base URL
const getBaseUrl = () => {
  // Check if we're running in a browser
  if (typeof window !== "undefined") {
    // In development
    if (
      window.location.hostname === "localhost" &&
      window.location.port === "3000"
    ) {
      return "http://localhost:8080";
    }

    // In production in container, use the same hostname
    // Container configuration: API on port 8080, UI on port 3000
    // Access internal API directly
    if (process.env.NODE_ENV === "production") {
      // When running in the same container, the Go server is localhost:8080
      return "http://localhost:8080";
    }

    // Fallback
    return `http://${window.location.hostname}:8080`;
  }

  // In server-side rendering - use the container-internal URL
  return process.env.API_URL || "http://localhost:8080";
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

export const checkLinks = async (
  request: CheckRequest
): Promise<LinkStatus[]> => {
  try {
    console.log(`Sending request to ${getBaseUrl()}/api/check-links`);
    const { data } = await apiClient.post<LinkStatus[]>(
      "/api/check-links",
      request
    );
    return data;
  } catch (error) {
    console.error("Error checking links:", error);
    throw error;
  }
};
