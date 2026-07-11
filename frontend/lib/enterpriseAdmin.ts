import { fetchJson } from "./api";

export interface GlobalAdminConsole {
  generatedAt: string;
  dashboard: Record<string, number>;
  roles: { role: string; count: number }[];
  licenses: Record<string, unknown>[];
  invoices: Record<string, unknown>[];
  systemHealth: {
    database: string;
    liveSocketStatus: number;
    uptimeSeconds: number;
  };
  storageUsage: {
    collections: Record<string, number>;
    dataSizeMb: number | null;
    storageSizeMb: number | null;
  };
  analytics: Record<string, unknown>[];
  auditLogs: Record<string, unknown>[];
  adminNotifications: string[];
}

export interface GlobalAdminConsoleResponse {
  success: boolean;
  console: GlobalAdminConsole;
}

export interface InvitationPayload {
  email: string;
  name?: string;
  organizationId?: string;
  permissions?: string[];
  plantIds?: string[];
  role: string;
}

export interface OnboardingProgress {
  _id?: string;
  completedSteps: string[];
  currentStep: string;
  progressPercent: number;
  status: string;
  steps: string[];
  validationErrors: string[];
  [key: string]: unknown;
}

export interface OnboardingResponse {
  progress: OnboardingProgress;
  success: boolean;
  validation?: {
    errors: string[];
    stats: Record<string, number>;
  };
}

export interface DemoResponse {
  success: boolean;
  counts?: Record<string, number>;
  credentials?: {
    adminEmail: string;
    engineerEmail: string;
    password: string;
  };
  deleted?: Record<string, number>;
}

export const fetchGlobalAdminConsole = () =>
  fetchJson<GlobalAdminConsoleResponse>("/api/enterprise/admin/console");

export const createInvitation = (payload: InvitationPayload) =>
  fetchJson("/api/enterprise/invitations", {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

export const assignEnterpriseRole = (
  userId: string,
  payload: { role: string; permissions?: string[]; plantIds?: string[] }
) =>
  fetchJson(`/api/enterprise/users/${encodeURIComponent(userId)}/role`, {
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });

export const fetchOnboardingProgress = (organizationId: string) =>
  fetchJson<OnboardingResponse>(
    `/api/enterprise/onboarding/${encodeURIComponent(organizationId)}`
  );

export const saveOnboardingProgress = (
  organizationId: string,
  payload: Record<string, unknown>
) =>
  fetchJson<OnboardingResponse>(
    `/api/enterprise/onboarding/${encodeURIComponent(organizationId)}`,
    {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    }
  );

export const completeOnboarding = (organizationId: string) =>
  fetchJson<OnboardingResponse>(
    `/api/enterprise/onboarding/${encodeURIComponent(organizationId)}/complete`,
    { method: "POST" }
  );

export const generateDemoMode = () =>
  fetchJson<DemoResponse>("/api/enterprise/demo/generate", { method: "POST" });

export const resetDemoMode = () =>
  fetchJson<DemoResponse>("/api/enterprise/demo/reset", { method: "POST" });
