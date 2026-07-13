"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus } from "lucide-react";
import { apiUrl } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const register = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/users");
    } catch {
      setMessage("Unable to connect to server");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-5 text-white">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-black/30">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-cyan-200">
            <UserPlus size={22} />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
              Access
            </p>
            <h1 className="text-2xl font-bold">Create Account</h1>
          </div>
        </div>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400/60"
        />

        <button
          type="button"
          onClick={register}
          disabled={loading}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
          {loading ? "Creating user" : "Create User"}
        </button>

        {message ? (
          <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
