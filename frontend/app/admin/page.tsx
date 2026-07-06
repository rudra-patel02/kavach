"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Factory, Loader2, Plus, RefreshCcw } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  createOrganization,
  createPlant,
  fetchTenantOverview,
  switchPlant,
} from "@/lib/enterprise";
import type { TenantOverview } from "@/types/enterprise";

const adminRoles = ["Super Admin", "Admin", "Plant Admin", "Plant Manager"];

export default function AdminPortalPage() {
  const [overview, setOverview] = useState<TenantOverview | null>(null);
  const [organizationName, setOrganizationName] = useState("");
  const [plantName, setPlantName] = useState("");
  const [plantLocation, setPlantLocation] = useState("");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      const response = await fetchTenantOverview();
      setOverview(response.overview);
      setSelectedOrganizationId(
        response.overview.organizations[0]?._id || selectedOrganizationId
      );
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load tenant overview"
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrganizationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOverview();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadOverview]);

  const handleCreateOrganization = async () => {
    if (!organizationName.trim()) return;
    setIsSaving(true);
    try {
      await createOrganization({ name: organizationName.trim() });
      setOrganizationName("");
      setMessage("Organization created.");
      await loadOverview();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to create organization"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePlant = async () => {
    if (!plantName.trim() || !selectedOrganizationId) return;
    setIsSaving(true);
    try {
      await createPlant({
        location: plantLocation,
        name: plantName.trim(),
        organizationId: selectedOrganizationId,
      });
      setPlantName("");
      setPlantLocation("");
      setMessage("Plant created.");
      await loadOverview();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to create plant"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout allowedRoles={adminRoles}>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase text-cyan-300">
              <Building2 size={18} />
              Enterprise Admin
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">
              Organization & Plant Management
            </h1>
            <p className="mt-2 max-w-3xl text-slate-400">
              Manage organizations, plants, departments, lines, machine groups,
              and user plant scope.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadOverview()}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
            Refresh
          </button>
        </section>

        {error ? <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
        {message ? <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{message}</div> : null}

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Object.entries(overview?.stats || {}).map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
              <p className="text-sm capitalize text-slate-400">{label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Building2 size={20} className="text-cyan-300" />
              Organizations
            </h2>
            <div className="mt-5 flex gap-3">
              <input
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder="Organization name"
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              />
              <button
                type="button"
                onClick={() => void handleCreateOrganization()}
                disabled={isSaving || !organizationName.trim()}
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-50"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {(overview?.organizations || []).map((organization) => (
                <div key={organization._id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <p className="font-semibold text-white">{organization.name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {String(organization.industry || "Industrial Manufacturing")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-5">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Factory size={20} className="text-cyan-300" />
              Plants
            </h2>
            <div className="mt-5 grid gap-3">
              <select
                value={selectedOrganizationId}
                onChange={(event) => setSelectedOrganizationId(event.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              >
                <option value="">Select organization</option>
                {(overview?.organizations || []).map((organization) => (
                  <option key={organization._id} value={organization._id}>
                    {organization.name}
                  </option>
                ))}
              </select>
              <input
                value={plantName}
                onChange={(event) => setPlantName(event.target.value)}
                placeholder="Plant name"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              />
              <input
                value={plantLocation}
                onChange={(event) => setPlantLocation(event.target.value)}
                placeholder="Location"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              />
              <button
                type="button"
                onClick={() => void handleCreatePlant()}
                disabled={isSaving || !plantName.trim() || !selectedOrganizationId}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 disabled:opacity-50"
              >
                <Plus size={16} />
                Add Plant
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {(overview?.plants || []).map((plant) => (
                <button
                  key={plant._id}
                  type="button"
                  onClick={() => {
                    void switchPlant(String(plant.plantId)).then((response) => {
                      const rawUser = localStorage.getItem("user");
                      try {
                        if (rawUser) {
                          const user = JSON.parse(rawUser) as Record<string, unknown>;
                          localStorage.setItem(
                            "user",
                            JSON.stringify({
                              ...user,
                              activePlantId: response.activePlantId,
                            })
                          );
                          window.dispatchEvent(new Event("kavach:auth-changed"));
                        }
                      } catch {
                        localStorage.removeItem("user");
                      }
                      setMessage(`Active plant switched to ${plant.name}.`);
                    });
                  }}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-left transition-colors hover:border-cyan-400/40"
                >
                  <p className="font-semibold text-white">{plant.name}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {String(plant.plantId)} | {String(plant.location || "No location")}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
