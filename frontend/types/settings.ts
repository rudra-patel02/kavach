export interface SettingsProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  phone?: string;
  employeeId?: string;
  status?: string;
  notificationPreferences?: SettingsNotificationPreferences;
  themePreference?: "dark" | "system";
}

export interface SettingsNotificationPreferences {
  email: boolean;
  criticalAlerts: boolean;
  weeklyReports: boolean;
}

export interface SettingsCompanyProfile {
  name: string;
  site: string;
  industry: string;
  timezone: string;
}

export interface SettingsResponse {
  success: boolean;
  profile: SettingsProfile;
  company: SettingsCompanyProfile;
  preferences: {
    theme: "dark" | "system";
    notifications: SettingsNotificationPreferences;
  };
}

export interface ProfileUpdateResponse {
  success: boolean;
  profile: SettingsProfile;
}

export interface PreferencesUpdateResponse {
  success: boolean;
  preferences: SettingsResponse["preferences"];
}
