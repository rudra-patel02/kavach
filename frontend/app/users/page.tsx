"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyRound,
  Loader2,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchJson } from "@/lib/api";

type UserStatus = "Active" | "Inactive" | "Suspended";

type UserRecord = {
  _id?: string;
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: UserStatus;
  permissions?: string[];
};

type UsersResponse = {
  success: boolean;
  users: UserRecord[];
  roles?: string[];
};

type UserUpdatePayload = Partial<UserRecord> & { password?: string };

const roleOptions = [
  "Super Admin",
  "Plant Manager",
  "Maintenance Manager",
  "Maintenance Engineer",
  "Operator",
  "Quality Engineer",
  "Viewer",
];

const permissionModules = [
  "dashboard",
  "machines",
  "analytics",
  "copilot",
  "digitalTwin",
  "workorders",
  "reports",
  "notifications",
  "users",
  "settings",
  "audit",
];

const roleMatrix: Record<string, string[]> = {
  "Super Admin": ["*"],
  "Plant Manager": [
    "dashboard",
    "machines",
    "analytics",
    "digitalTwin",
    "workorders",
    "reports",
    "notifications",
    "users",
    "settings",
    "audit",
  ],
  "Maintenance Manager": [
    "dashboard",
    "machines",
    "analytics",
    "copilot",
    "digitalTwin",
    "workorders",
    "reports",
    "notifications",
    "audit",
  ],
  "Maintenance Engineer": [
    "dashboard",
    "machines",
    "analytics",
    "copilot",
    "digitalTwin",
    "workorders",
    "reports",
    "notifications",
  ],
  Operator: [
    "dashboard",
    "machines",
    "analytics",
    "digitalTwin",
    "workorders",
    "reports",
    "notifications",
  ],
  "Quality Engineer": [
    "dashboard",
    "machines",
    "analytics",
    "digitalTwin",
    "workorders",
    "reports",
    "notifications",
  ],
  Viewer: ["dashboard", "machines", "analytics", "digitalTwin", "reports"],
};

const emptyDraft = {
  department: "Maintenance",
  email: "",
  name: "",
  password: "",
  role: "Viewer",
  status: "Active" as UserStatus,
};

const temporaryPasswordChars =
  "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

const generateTemporaryPassword = () => {
  const values = new Uint32Array(16);
  window.crypto.getRandomValues(values);

  return Array.from(
    values,
    (value) => temporaryPasswordChars[value % temporaryPasswordChars.length]
  ).join("");
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [roles, setRoles] = useState(roleOptions);
  const [draft, setDraft] = useState(emptyDraft);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchJson<UsersResponse>("/api/users");
      setUsers(data.users);
      setRoles(data.roles?.length ? data.roles : roleOptions);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return users;

    return users.filter((user) =>
      [user.name, user.email, user.role, user.department, user.status]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [query, users]);

  const createUser = async () => {
    setCreating(true);

    try {
      const response = await fetchJson<{ success: boolean; user: UserRecord }>(
        "/api/users",
        {
          body: JSON.stringify(draft),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }
      );
      setUsers((currentUsers) => [response.user, ...currentUsers]);
      setDraft(emptyDraft);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to create user"
      );
    } finally {
      setCreating(false);
    }
  };

  const updateUser = async (id: string, payload: UserUpdatePayload) => {
    setSavingId(id);

    try {
      const response = await fetchJson<{ success: boolean; user: UserRecord }>(
        `/api/users/${encodeURIComponent(id)}`,
        {
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        }
      );
      setUsers((currentUsers) =>
        currentUsers.map((user) => (user.id === id ? response.user : user))
      );
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update user"
      );
    } finally {
      setSavingId(null);
    }
  };

  const resetPassword = async (id: string) => {
    const generatedPassword = generateTemporaryPassword();
    const password = window.prompt("Temporary password", generatedPassword);

    if (!password) {
      return;
    }

    await updateUser(id, { password });
  };

  const deleteUser = async (id: string) => {
    setSavingId(id);

    try {
      await fetchJson(`/api/users/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      setUsers((currentUsers) => currentUsers.filter((user) => user.id !== id));
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to delete user"
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <DashboardLayout allowedRoles={["Super Admin", "Admin", "Plant Manager"]}>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase text-cyan-300">
              <ShieldCheck size={18} />
              Role Based Access Control
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">User Management</h1>
            <p className="mt-2 text-slate-400">
              Manage enterprise roles, user status, and effective permissions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadUsers()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
            Refresh
          </button>
        </section>

        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-cyan-300">
            <UserPlus size={17} />
            Create User
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_150px_150px_160px_auto]">
            <input
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="Full name"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            />
            <input
              value={draft.email}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              placeholder="Email"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            />
            <input
              value={draft.password}
              onChange={(event) => setDraft({ ...draft, password: event.target.value })}
              placeholder="Password"
              type="password"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            />
            <select
              value={draft.role}
              onChange={(event) => setDraft({ ...draft, role: event.target.value })}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <input
              value={draft.department}
              onChange={(event) =>
                setDraft({ ...draft, department: event.target.value })
              }
              placeholder="Department"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
            />
            <button
              type="button"
              onClick={() => void createUser()}
              disabled={creating}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
              Add
            </button>
          </div>
        </section>

        <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/85 px-4 py-3">
          <Search size={18} className="text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users, roles, departments, status..."
            className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
          />
        </label>

        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Department</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Permissions</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-300">
                      Loading users...
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t border-slate-800">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(event) =>
                            void updateUser(user.id, { role: event.target.value })
                          }
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                          {roles.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {user.department}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.status}
                          onChange={(event) =>
                            void updateUser(user.id, {
                              status: event.target.value as UserStatus,
                            })
                          }
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                          {["Active", "Inactive", "Suspended"].map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex max-w-md flex-wrap gap-1.5">
                          {(user.permissions || []).slice(0, 8).map((permission) => (
                            <span
                              key={permission}
                              className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-100"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void updateUser(user.id, { status: "Active" })
                            }
                            disabled={savingId === user.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/10 disabled:opacity-45"
                          >
                            <Save size={14} />
                            Enable
                          </button>
                          <button
                            type="button"
                            onClick={() => void resetPassword(user.id)}
                            disabled={savingId === user.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-500/10 disabled:opacity-45"
                          >
                            <KeyRound size={14} />
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteUser(user.id)}
                            disabled={savingId === user.id}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-semibold text-red-100 transition-colors hover:bg-red-500/10 disabled:opacity-45"
                          >
                            {savingId === user.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-cyan-300">
            <ShieldCheck size={17} />
            Permission Matrix
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">Role</th>
                  {permissionModules.map((module) => (
                    <th key={module} className="px-3 py-2 text-center">
                      {module}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roleOptions.map((role) => (
                  <tr key={role} className="border-t border-slate-800">
                    <td className="px-3 py-3 font-semibold text-white">{role}</td>
                    {permissionModules.map((module) => {
                      const allowed =
                        roleMatrix[role]?.includes("*") ||
                        roleMatrix[role]?.includes(module);

                      return (
                        <td key={module} className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${
                              allowed
                                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                                : "border-slate-700 bg-slate-950 text-slate-600"
                            }`}
                          >
                            {allowed ? "Y" : ""}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
