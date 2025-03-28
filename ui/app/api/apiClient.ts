import axios from "axios";
import { CheckRequest, LinkStatus } from "./model/types";

const API_BASE_URL = "http://localhost:8080";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const checkLinks = async (
  request: CheckRequest
): Promise<LinkStatus[]> => {
  const { data } = await apiClient.post<LinkStatus[]>("/check-links", request);
  return data;
};
