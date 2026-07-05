import { fetchJson } from "./api";
import type {
  PreferencesUpdateResponse,
  ProfileUpdateResponse,
  SettingsNotificationPreferences,
  SettingsResponse,
} from "@/types/settings";

export const fetchSettings = () => fetchJson<SettingsResponse>("/api/settings");

export const updateProfileSettings = (payload: {
  name: string;
  department: string;
  phone: string;
}) =>
  fetchJson<ProfileUpdateResponse>("/api/settings/profile", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const updatePassword = (payload: {
  currentPassword: string;
  nextPassword: string;
}) =>
  fetchJson<{ success: boolean; message: string }>("/api/settings/password", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

export const updatePreferences = (payload: {
  theme: "dark" | "system";
  notifications: SettingsNotificationPreferences;
}) =>
  fetchJson<PreferencesUpdateResponse>("/api/settings/preferences", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
