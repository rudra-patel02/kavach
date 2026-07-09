import { fetchJson } from "./api";
import type { GlobalSearchResponse } from "@/types/search";

export const globalSearch = (query: string) =>
  fetchJson<GlobalSearchResponse>(`/api/search?q=${encodeURIComponent(query)}`);
