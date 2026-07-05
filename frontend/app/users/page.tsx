"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchJson } from "@/lib/api";

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchJson<{ success: boolean; users: User[] }>(
        "/api/users"
      );

      setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadUsers]);

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <section className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-cyan-300">
              Access Control
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">
              User Management
            </h1>
            <p className="mt-2 text-slate-400">Enterprise user directory</p>
          </div>

          <Link
            href="/register"
            className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20"
          >
            Add User
          </Link>
        </section>

        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-8 text-slate-300">
            Loading users...
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/75">
            <table className="w-full text-sm">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left">Name</th>
                  <th className="px-5 py-4 text-left">Email</th>
                  <th className="px-5 py-4 text-left">Role</th>
                  <th className="px-5 py-4 text-left">Department</th>
                  <th className="px-5 py-4 text-left">Status</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-t border-slate-800">
                    <td className="px-5 py-4 font-semibold text-white">
                      {user.name}
                    </td>
                    <td className="px-5 py-4 text-slate-300">{user.email}</td>
                    <td className="px-5 py-4 text-slate-300">{user.role}</td>
                    <td className="px-5 py-4 text-slate-300">
                      {user.department}
                    </td>
                    <td className="px-5 py-4 text-slate-300">{user.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
