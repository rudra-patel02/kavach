"use client";

import { useCallback, useEffect, useState } from "react";

import { ROLES } from "@/lib/auth";
import { createUser, getUsers, updateUser } from "@/lib/data";
import type { ManagedUser, Role } from "@/types";

// Manager-only user administration: create a user with a server-assigned role,
// change a role, deactivate. Roles are never self-selected — set here only.
export default function AdminUsersView() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Viewer");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await getUsers();
      setUsers(result.users);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount; setState runs after await, not synchronously
    void load();
  }, [load]);

  const onCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError("Name, email and an 8+ character password are required");
      return;
    }
    setBusy(true);
    try {
      await createUser({ name: name.trim(), email: email.trim(), password, role });
      setName("");
      setEmail("");
      setPassword("");
      setRole("Viewer");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (id: string, nextRole: Role) => {
    try {
      await updateUser(id, { role: nextRole });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const toggleActive = async (u: ManagedUser) => {
    try {
      await updateUser(u.id, { status: u.status === "Inactive" ? "Active" : "Inactive" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">Users &amp; roles</h1>
      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={onCreate}
        className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          aria-label="Name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          aria-label="Email"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (8+)"
          aria-label="Password"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          aria-label="Role"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add user"}
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 text-slate-900">{u.name}</td>
                <td className="px-4 py-2 text-slate-700">{u.email}</td>
                <td className="px-4 py-2">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value as Role)}
                    aria-label={`Role for ${u.name}`}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2 text-slate-700">{u.status ?? "Active"}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => toggleActive(u)}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                  >
                    {u.status === "Inactive" ? "Reactivate" : "Deactivate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
