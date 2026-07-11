"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  CheckCircle2,
  KeyRound,
  Loader2,
  Moon,
  Save,
  Shield,
  UserRound,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { notifyAuthChanged } from "@/lib/auth";
import {
  fetchSettings,
  updatePassword,
  updatePreferences,
  updateProfileSettings,
} from "@/lib/settings";
import type {
  SettingsCompanyProfile,
  SettingsNotificationPreferences,
  SettingsProfile,
} from "@/types/settings";

const defaultNotifications: SettingsNotificationPreferences = {
  email: true,
  criticalAlerts: true,
  weeklyReports: true,
};

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-cyan-400"
      />
    </label>
  );
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [company, setCompany] = useState<SettingsCompanyProfile | null>(null);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [theme, setTheme] = useState<"dark" | "system">("dark");
  const [notifications, setNotifications] =
    useState<SettingsNotificationPreferences>(defaultNotifications);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings()
      .then((response) => {
        setProfile(response.profile);
        setCompany(response.company);
        setName(response.profile.name || "");
        setDepartment(response.profile.department || "");
        setPhone(response.profile.phone || "");
        setTheme(response.preferences.theme);
        setNotifications(response.preferences.notifications || defaultNotifications);
        setError(null);
      })
      .catch((requestError: unknown) => {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Failed to load settings"
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const saveProfile = async () => {
    setIsSavingProfile(true);
    setMessage(null);

    try {
      const response = await updateProfileSettings({ name, department, phone });
      setProfile(response.profile);
      localStorage.setItem("user", JSON.stringify(response.profile));
      notifyAuthChanged();
      setMessage("Profile updated.");
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update profile"
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const savePreferences = async () => {
    setIsSavingPreferences(true);
    setMessage(null);

    try {
      const response = await updatePreferences({ theme, notifications });
      setTheme(response.preferences.theme);
      setNotifications(response.preferences.notifications);
      setMessage("Preferences saved.");
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update preferences"
      );
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const savePassword = async () => {
    setIsSavingPassword(true);
    setMessage(null);

    try {
      const response = await updatePassword({ currentPassword, nextPassword });
      setCurrentPassword("");
      setNextPassword("");
      setMessage(response.message);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update password"
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase text-cyan-300">
              <Shield size={18} />
              Settings
            </div>
            <h1 className="text-3xl font-bold text-white md:text-4xl">
              Workspace Control Center
            </h1>
            <p className="mt-2 max-w-3xl text-slate-400">
              Profile, security, notifications, theme, and company operating
              profile.
            </p>
          </div>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <CheckCircle2 size={16} />
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/75 py-20 text-center">
            <Loader2 className="mx-auto animate-spin text-cyan-300" size={36} />
            <p className="mt-3 font-semibold text-slate-200">
              Loading settings
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-6">
              <section
                id="profile"
                className="rounded-xl border border-slate-800 bg-slate-900/75 p-5"
              >
                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                  <UserRound size={20} className="text-cyan-300" />
                  Profile
                </h2>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className="space-y-2">
                    <span className="text-sm text-slate-400">Name</span>
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-slate-400">Department</span>
                    <input
                      value={department}
                      onChange={(event) => setDepartment(event.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-slate-400">Phone</span>
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => void saveProfile()}
                  disabled={isSavingProfile}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:opacity-60"
                >
                  {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Save Profile
                </button>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                  <Bell size={20} className="text-cyan-300" />
                  Notifications
                </h2>
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Toggle
                    label="Email alerts"
                    checked={notifications.email}
                    onChange={(checked) =>
                      setNotifications((current) => ({ ...current, email: checked }))
                    }
                  />
                  <Toggle
                    label="Critical alerts"
                    checked={notifications.criticalAlerts}
                    onChange={(checked) =>
                      setNotifications((current) => ({
                        ...current,
                        criticalAlerts: checked,
                      }))
                    }
                  />
                  <Toggle
                    label="Weekly reports"
                    checked={notifications.weeklyReports}
                    onChange={(checked) =>
                      setNotifications((current) => ({
                        ...current,
                        weeklyReports: checked,
                      }))
                    }
                  />
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                  <Moon size={20} className="text-cyan-300" />
                  Theme
                </h2>
                <div className="mt-5 inline-flex rounded-xl border border-slate-700 bg-slate-950 p-1">
                  {(["dark", "system"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTheme(item)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                        theme === item
                          ? "bg-cyan-500/20 text-cyan-100"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => void savePreferences()}
                    disabled={isSavingPreferences}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:opacity-60"
                  >
                    {isSavingPreferences ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Preferences
                  </button>
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                  <KeyRound size={20} className="text-cyan-300" />
                  Password
                </h2>
                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    type="password"
                    placeholder="Current password"
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                  />
                  <input
                    value={nextPassword}
                    onChange={(event) => setNextPassword(event.target.value)}
                    type="password"
                    placeholder="New password"
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void savePassword()}
                  disabled={isSavingPassword || !currentPassword || !nextPassword}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:opacity-60"
                >
                  {isSavingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                  Update Password
                </button>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                  <Shield size={20} className="text-cyan-300" />
                  Access
                </h2>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-slate-500">Role</p>
                    <p className="mt-1 font-semibold text-white">
                      {profile?.role || "Viewer"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-slate-500">Email</p>
                    <p className="mt-1 font-semibold text-white">
                      {profile?.email}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-slate-500">Status</p>
                    <p className="mt-1 font-semibold text-white">
                      {profile?.status || "Active"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                  <Building2 size={20} className="text-cyan-300" />
                  Company
                </h2>
                <div className="mt-5 space-y-3 text-sm">
                  {company
                    ? Object.entries(company).map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                        >
                          <p className="capitalize text-slate-500">{key}</p>
                          <p className="mt-1 font-semibold text-white">{value}</p>
                        </div>
                      ))
                    : null}
                </div>
              </section>
            </aside>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
