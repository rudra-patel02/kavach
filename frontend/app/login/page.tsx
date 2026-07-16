"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import IndustrialTwinBackground from "@/components/layout/IndustrialTwinBackground";
import { apiUrl } from "@/lib/api";
import { notifyAuthChanged, useStoredToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const token = useStoredToken();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (token) {
      router.replace("/");
    }
  }, [router, token]);

  const login = async () => {
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError("Enter a valid email address");
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    let timeoutId: number | undefined;

    try {
      setLoading(true);
      const controller = new AbortController();
      timeoutId = window.setTimeout(() => controller.abort(), 15000);

      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      localStorage.setItem("user", JSON.stringify(data.user));
      notifyAuthChanged();

      router.replace("/");
    } catch {
      setError("Unable to connect to server.");
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      setLoading(false);
    }
  };

  return (
    <div className="cinematic-shell relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-5 py-10">
      <IndustrialTwinBackground />
      <div className="login-grid items-center">
        <section className="login-aside holographic-panel rounded-2xl p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3">
              <ShieldCheck size={26} className="text-cyan-200" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
                Secure operations
              </p>
              <h1 className="text-hologram mt-2 text-5xl font-black tracking-tight">
                KAVACH
              </h1>
            </div>
          </div>

          <p className="mt-6 max-w-xl text-sm leading-6 text-slate-300">
            Industrial command access for live machine telemetry, predictive
            maintenance, AI insight, and enterprise operations governance.
          </p>

          <div className="mt-8 grid gap-3">
            {[
              "JWT protected sessions",
              "Realtime plant intelligence",
              "Enterprise control surface",
            ].map((item) => (
              <div
                key={item}
                className="premium-tile rounded-xl px-4 py-3 text-sm font-semibold text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="premium-card w-full rounded-2xl p-8 shadow-2xl sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 shadow-lg shadow-cyan-950/30">
              <LockKeyhole size={26} className="text-cyan-200" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
              Operator access
            </p>
            <h1 className="text-hologram mt-2 text-3xl font-black tracking-tight">
              KAVACH Login
            </h1>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-400/30 bg-red-500/15 p-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <div className="premium-input mb-4 flex items-center rounded-xl px-4 py-3">
            <Mail size={18} className="mr-3 text-slate-500" />
            <input
              type="email"
              placeholder="Email"
              className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-slate-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") login();
              }}
            />
          </div>

          <div className="premium-input relative mb-6 flex items-center rounded-xl px-4 py-3">
            <LockKeyhole size={18} className="mr-3 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="min-w-0 flex-1 bg-transparent pr-12 text-white outline-none placeholder:text-slate-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") login();
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-cyan-300 transition-colors hover:bg-cyan-300/10 hover:text-cyan-100"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            disabled={loading}
            onClick={login}
            className={`premium-button w-full rounded-xl p-3 font-bold transition ${
              loading ? "cursor-not-allowed opacity-70" : ""
            }`}
          >
            {loading ? "Signing In..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
