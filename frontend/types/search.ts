export interface GlobalSearchResult {
  id: string;
  type: "Machine" | "Prediction" | "Alert" | "Engineer" | "Work Order";
  title: string;
  subtitle: string;
  href: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface GlobalSearchResponse {
  success: boolean;
  query: string;
  results: GlobalSearchResult[];
}
