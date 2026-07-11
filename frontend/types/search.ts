export interface GlobalSearchResult {
  id: string;
  type:
    | "Alert"
    | "Machine"
    | "Notification"
    | "Organization"
    | "Plant"
    | "Prediction"
    | "Report"
    | "User"
    | "Work Order";
  title: string;
  subtitle: string;
  href: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface GlobalSearchResponse {
  filters?: {
    availableTypes: string[];
    type: string | null;
  };
  pagination?: {
    limit: number;
    page: number;
    pages: number;
    total: number;
  };
  success: boolean;
  query: string;
  results: GlobalSearchResult[];
}
