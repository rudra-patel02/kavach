"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  History,
  Loader2,
  MessageSquare,
  Paperclip,
  Printer,
  RefreshCcw,
  Save,
  Search,
  UserPlus,
  Wrench,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  createWorkOrder,
  downloadWorkOrderExport,
  fetchWorkOrder,
  fetchWorkOrders,
  printWorkOrder,
  updateWorkOrder,
} from "@/lib/workorders";
import socket from "@/lib/socket";
import type {
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrderUpdatePayload,
} from "@/types/workOrder";

const statusOptions: WorkOrderStatus[] = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_PARTS",
  "COMPLETED",
  "CANCELLED",
];

const priorityOptions: WorkOrderPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

const priorityRank: Record<WorkOrderPriority, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const statusClasses: Record<WorkOrderStatus, string> = {
  OPEN: "border-cyan-400/30 bg-cyan-500/10 text-cyan-200",
  ASSIGNED: "border-blue-400/30 bg-blue-500/10 text-blue-200",
  IN_PROGRESS: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  WAITING_PARTS: "border-violet-400/30 bg-violet-500/10 text-violet-200",
  COMPLETED: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  CANCELLED: "border-slate-500/30 bg-slate-700/50 text-slate-300",
};

const priorityClasses: Record<WorkOrderPriority, string> = {
  LOW: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  MEDIUM: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  HIGH: "border-orange-400/30 bg-orange-500/10 text-orange-200",
  CRITICAL: "border-red-400/30 bg-red-500/10 text-red-200",
};

const statToneClasses = {
  amber: "bg-amber-500/10 text-amber-300",
  blue: "bg-blue-500/10 text-blue-300",
  cyan: "bg-cyan-500/10 text-cyan-300",
  emerald: "bg-emerald-500/10 text-emerald-300",
  red: "bg-red-500/10 text-red-300",
};

const formatStatus = (status: WorkOrderStatus) => status.replaceAll("_", " ");

const formatDate = (value: string | null) => {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat(undefined, {
    currency: "USD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value || 0);

const upsertWorkOrder = (items: WorkOrder[], workOrder: WorkOrder) => {
  const exists = items.some((item) => item.id === workOrder.id);

  if (!exists) {
    return [workOrder, ...items];
  }

  return items.map((item) => (item.id === workOrder.id ? workOrder : item));
};

type WorkOrderView = "dashboard" | "create" | "engineer" | "completed";

const emptyCreateDraft = {
  assignedEngineer: "",
  costEstimate: 0,
  description: "",
  estimatedHours: 2,
  machineId: "",
  maintenanceType: "Preventive" as WorkOrder["maintenanceType"],
  priority: "MEDIUM" as WorkOrderPriority,
  scheduledDate: "",
};

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | WorkOrderStatus>(
    "ALL"
  );
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | WorkOrderPriority>(
    "ALL"
  );
  const [sortBy, setSortBy] = useState("date");
  const [engineerDraft, setEngineerDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<WorkOrderStatus>("OPEN");
  const [noteDraft, setNoteDraft] = useState("");
  const [activeView, setActiveView] = useState<WorkOrderView>("dashboard");
  const [createDraft, setCreateDraft] = useState(emptyCreateDraft);
  const [isCreating, setIsCreating] = useState(false);

  const loadWorkOrders = useCallback(async () => {
    try {
      const response = await fetchWorkOrders();
      setWorkOrders(response.workOrders);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load work orders"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadWorkOrders();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [loadWorkOrders]);

  useEffect(() => {
    const handleNewWorkOrder = (workOrder: WorkOrder) => {
      setWorkOrders((currentWorkOrders) =>
        upsertWorkOrder(currentWorkOrders, workOrder)
      );
    };

    const handleUpdatedWorkOrder = (workOrder: WorkOrder) => {
      setWorkOrders((currentWorkOrders) =>
        upsertWorkOrder(currentWorkOrders, workOrder)
      );
      setSelectedWorkOrder((currentWorkOrder) =>
        currentWorkOrder?.id === workOrder.id ? workOrder : currentWorkOrder
      );
    };

    const handleDeletedWorkOrder = (payload: { id: string }) => {
      setWorkOrders((currentWorkOrders) =>
        currentWorkOrders.filter((workOrder) => workOrder.id !== payload.id)
      );
      setSelectedWorkOrder((currentWorkOrder) =>
        currentWorkOrder?.id === payload.id ? null : currentWorkOrder
      );
    };

    socket.on("workorder:new", handleNewWorkOrder);
    socket.on("workorder:updated", handleUpdatedWorkOrder);
    socket.on("workorder:deleted", handleDeletedWorkOrder);

    return () => {
      socket.off("workorder:new", handleNewWorkOrder);
      socket.off("workorder:updated", handleUpdatedWorkOrder);
      socket.off("workorder:deleted", handleDeletedWorkOrder);
    };
  }, []);

  const openWorkOrder = async (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setEngineerDraft(workOrder.assignedEngineer || "");
    setStatusDraft(workOrder.status);
    setNoteDraft("");
    setIsDetailLoading(true);

    try {
      const response = await fetchWorkOrder(workOrder.id);
      setSelectedWorkOrder(response.workOrder);
      setEngineerDraft(response.workOrder.assignedEngineer || "");
      setStatusDraft(response.workOrder.status);
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to load work order"
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const saveSelectedWorkOrder = async (payload: WorkOrderUpdatePayload) => {
    if (!selectedWorkOrder) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await updateWorkOrder(selectedWorkOrder.id, payload);
      setSelectedWorkOrder(response.workOrder);
      setWorkOrders((currentWorkOrders) =>
        upsertWorkOrder(currentWorkOrders, response.workOrder)
      );
      setEngineerDraft(response.workOrder.assignedEngineer || "");
      setStatusDraft(response.workOrder.status);
      setNoteDraft("");
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to update work order"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const closeWorkOrder = async (workOrder: WorkOrder) => {
    try {
      const response = await updateWorkOrder(workOrder.id, {
        status: "COMPLETED",
      });
      setWorkOrders((currentWorkOrders) =>
        upsertWorkOrder(currentWorkOrders, response.workOrder)
      );
      setSelectedWorkOrder((currentWorkOrder) =>
        currentWorkOrder?.id === response.workOrder.id
          ? response.workOrder
          : currentWorkOrder
      );
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to close work order"
      );
    }
  };

  const createManualWorkOrder = async () => {
    setIsCreating(true);

    try {
      const response = await createWorkOrder({
        assignedEngineer: createDraft.assignedEngineer,
        costEstimate: Number(createDraft.costEstimate) || 0,
        description: createDraft.description,
        estimatedHours: Number(createDraft.estimatedHours) || 0,
        machineId: createDraft.machineId,
        maintenanceType: createDraft.maintenanceType,
        priority: createDraft.priority,
        scheduledDate: createDraft.scheduledDate || null,
      });
      setWorkOrders((currentWorkOrders) =>
        upsertWorkOrder(currentWorkOrders, response.workOrder)
      );
      setCreateDraft(emptyCreateDraft);
      setActiveView("dashboard");
      setError(null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Failed to create work order"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const filteredWorkOrders = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return workOrders
      .filter((workOrder) => {
        if (
          activeView === "engineer" &&
          (workOrder.status === "COMPLETED" || !workOrder.assignedEngineer)
        ) {
          return false;
        }

        if (activeView === "completed" && workOrder.status !== "COMPLETED") {
          return false;
        }

        if (statusFilter !== "ALL" && workOrder.status !== statusFilter) {
          return false;
        }

        if (
          priorityFilter !== "ALL" &&
          workOrder.priority !== priorityFilter
        ) {
          return false;
        }

        if (!searchText) {
          return true;
        }

        return [
          workOrder.workOrderId,
          workOrder.machineId,
          workOrder.machineName,
          workOrder.department,
          workOrder.assignedEngineer,
        ]
          .join(" ")
          .toLowerCase()
          .includes(searchText);
      })
      .sort((a, b) => {
        if (sortBy === "priority") {
          return priorityRank[b.priority] - priorityRank[a.priority];
        }

        if (sortBy === "status") {
          return a.status.localeCompare(b.status);
        }

        if (sortBy === "engineer") {
          return (a.assignedEngineer || "Unassigned").localeCompare(
            b.assignedEngineer || "Unassigned"
          );
        }

        if (sortBy === "department") {
          return a.department.localeCompare(b.department);
        }

        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      });
  }, [activeView, priorityFilter, search, sortBy, statusFilter, workOrders]);

  const stats = useMemo(
    () => ({
      open: workOrders.filter((workOrder) => workOrder.status === "OPEN").length,
      assigned: workOrders.filter(
        (workOrder) => workOrder.status === "ASSIGNED"
      ).length,
      inProgress: workOrders.filter(
        (workOrder) => workOrder.status === "IN_PROGRESS"
      ).length,
      completed: workOrders.filter(
        (workOrder) => workOrder.status === "COMPLETED"
      ).length,
      critical: workOrders.filter(
        (workOrder) => workOrder.priority === "CRITICAL"
      ).length,
    }),
    [workOrders]
  );

  const statCards = [
    { label: "Open", value: stats.open, icon: ClipboardList, tone: "cyan" },
    { label: "Assigned", value: stats.assigned, icon: UserPlus, tone: "blue" },
    { label: "In Progress", value: stats.inProgress, icon: Wrench, tone: "amber" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, tone: "emerald" },
    { label: "Critical", value: stats.critical, icon: AlertTriangle, tone: "red" },
  ] as const;

  return (
    <DashboardLayout>
      <div className="min-h-[calc(100vh-9rem)] space-y-6 text-white">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3 text-sm font-semibold uppercase text-cyan-300">
                <ClipboardList size={18} />
                Maintenance Operations
              </div>
              <h1 className="text-3xl font-bold text-white md:text-4xl">
                Work Orders
              </h1>
              <p className="mt-2 max-w-3xl text-slate-400">
                AI-triggered maintenance execution, assignment, status tracking,
                and technician notes for monitored assets.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveView("create")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/20"
              >
                <UserPlus size={16} />
                New
              </button>
              <button
                type="button"
                onClick={() => void downloadWorkOrderExport("pdf")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10"
              >
                <Download size={16} />
                PDF
              </button>
              <button
                type="button"
                onClick={() => void downloadWorkOrderExport("excel")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10"
              >
                <Download size={16} />
                Excel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  void loadWorkOrders();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20"
              >
                <RefreshCcw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-wrap gap-2">
          {[
            ["dashboard", "Dashboard"],
            ["create", "Create Work Order"],
            ["engineer", "Engineer Queue"],
            ["completed", "Completed Jobs"],
          ].map(([view, label]) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveView(view as WorkOrderView)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                activeView === view
                  ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                  : "border-slate-800 bg-slate-900/75 text-slate-300 hover:border-cyan-400/30 hover:text-cyan-100"
              }`}
            >
              {label}
            </button>
          ))}
        </section>

        {activeView === "create" ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/75 p-5">
            <div className="grid gap-3 lg:grid-cols-[150px_150px_160px_160px_1fr]">
              <input
                value={createDraft.machineId}
                onChange={(event) =>
                  setCreateDraft({
                    ...createDraft,
                    machineId: event.target.value,
                  })
                }
                placeholder="Machine ID"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
              />
              <select
                value={createDraft.priority}
                onChange={(event) =>
                  setCreateDraft({
                    ...createDraft,
                    priority: event.target.value as WorkOrderPriority,
                  })
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              <select
                value={createDraft.maintenanceType}
                onChange={(event) =>
                  setCreateDraft({
                    ...createDraft,
                    maintenanceType: event.target.value as WorkOrder["maintenanceType"],
                  })
                }
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
              >
                {["Preventive", "Corrective", "Predictive", "Emergency", "Inspection"].map(
                  (type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  )
                )}
              </select>
              <input
                value={createDraft.scheduledDate}
                onChange={(event) =>
                  setCreateDraft({
                    ...createDraft,
                    scheduledDate: event.target.value,
                  })
                }
                type="datetime-local"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
              />
              <input
                value={createDraft.assignedEngineer}
                onChange={(event) =>
                  setCreateDraft({
                    ...createDraft,
                    assignedEngineer: event.target.value,
                  })
                }
                placeholder="Assigned engineer"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
              />
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_140px_140px_auto]">
              <textarea
                value={createDraft.description}
                onChange={(event) =>
                  setCreateDraft({
                    ...createDraft,
                    description: event.target.value,
                  })
                }
                placeholder="Maintenance description"
                rows={3}
                className="resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
              />
              <input
                value={createDraft.estimatedHours}
                onChange={(event) =>
                  setCreateDraft({
                    ...createDraft,
                    estimatedHours: Number(event.target.value),
                  })
                }
                min={0}
                step={0.5}
                type="number"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
              />
              <input
                value={createDraft.costEstimate}
                onChange={(event) =>
                  setCreateDraft({
                    ...createDraft,
                    costEstimate: Number(event.target.value),
                  })
                }
                min={0}
                type="number"
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
              />
              <button
                type="button"
                onClick={() => void createManualWorkOrder()}
                disabled={
                  isCreating ||
                  !createDraft.machineId.trim() ||
                  !createDraft.description.trim()
                }
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Create
              </button>
            </div>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {statCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-400">
                    {item.label}
                  </p>
                  <div className={`rounded-lg p-2 ${statToneClasses[item.tone]}`}>
                    <Icon size={18} />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-bold text-white">
                  {item.value}
                </p>
              </div>
            );
          })}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/75">
          <div className="border-b border-slate-800 p-5">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_170px_170px_180px]">
              <div className="flex items-center rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3">
                <Search size={18} className="text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search ID, machine, engineer, department"
                  className="ml-3 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>

              <label className="flex items-center rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3">
                <Filter size={16} className="mr-2 text-slate-500" />
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as "ALL" | WorkOrderStatus)
                  }
                  className="w-full bg-transparent text-sm text-white outline-none"
                >
                  <option className="bg-slate-950" value="ALL">
                    All Status
                  </option>
                  {statusOptions.map((status) => (
                    <option key={status} className="bg-slate-950" value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3">
                <Filter size={16} className="mr-2 text-slate-500" />
                <select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(
                      event.target.value as "ALL" | WorkOrderPriority
                    )
                  }
                  className="w-full bg-transparent text-sm text-white outline-none"
                >
                  <option className="bg-slate-950" value="ALL">
                    All Priority
                  </option>
                  {priorityOptions.map((priority) => (
                    <option
                      key={priority}
                      className="bg-slate-950"
                      value={priority}
                    >
                      {priority}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3">
                <Clock size={16} className="mr-2 text-slate-500" />
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value)}
                  className="w-full bg-transparent text-sm text-white outline-none"
                >
                  <option className="bg-slate-950" value="date">
                    Date
                  </option>
                  <option className="bg-slate-950" value="priority">
                    Priority
                  </option>
                  <option className="bg-slate-950" value="status">
                    Status
                  </option>
                  <option className="bg-slate-950" value="engineer">
                    Engineer
                  </option>
                  <option className="bg-slate-950" value="department">
                    Department
                  </option>
                </select>
              </label>
            </div>
          </div>

          {error ? (
            <div className="m-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-5 py-4 text-left">ID</th>
                  <th className="px-5 py-4 text-left">Machine</th>
                  <th className="px-5 py-4 text-left">Priority</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4 text-left">Engineer</th>
                  <th className="px-5 py-4 text-left">Due Date</th>
                  <th className="px-5 py-4 text-left">Downtime</th>
                  <th className="px-5 py-4 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <Loader2
                        className="mx-auto animate-spin text-cyan-300"
                        size={34}
                      />
                      <p className="mt-3 font-semibold text-slate-200">
                        Loading work orders
                      </p>
                    </td>
                  </tr>
                ) : filteredWorkOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20">
                        <ClipboardList size={24} />
                      </div>
                      <p className="mt-4 font-semibold text-white">
                        No work orders found
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Maintenance operations are clear for this view.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredWorkOrders.map((workOrder) => (
                    <tr
                      key={workOrder.id}
                      className="border-t border-slate-800 transition-colors hover:bg-slate-800/50"
                    >
                      <td className="px-5 py-4 font-semibold text-cyan-200">
                        {workOrder.workOrderId}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">
                          {workOrder.machineName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {workOrder.machineId} - {workOrder.department}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${priorityClasses[workOrder.priority]}`}
                        >
                          {workOrder.priority}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses[workOrder.status]}`}
                        >
                          {formatStatus(workOrder.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {workOrder.assignedEngineer || "Unassigned"}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {formatDate(workOrder.scheduledDate || workOrder.dueDate)}
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {workOrder.estimatedHours || workOrder.estimatedDowntimeHours} hrs
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void openWorkOrder(workOrder)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-100"
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => void openWorkOrder(workOrder)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-blue-100"
                          >
                            <UserPlus size={14} />
                            Assign
                          </button>
                          <button
                            type="button"
                            onClick={() => void openWorkOrder(workOrder)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-amber-100"
                          >
                            <Wrench size={14} />
                            Status
                          </button>
                          <button
                            type="button"
                            onClick={() => void openWorkOrder(workOrder)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-100"
                          >
                            <MessageSquare size={14} />
                            Notes
                          </button>
                          <button
                            type="button"
                            onClick={() => void closeWorkOrder(workOrder)}
                            disabled={workOrder.status === "COMPLETED"}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <CheckCircle2 size={14} />
                            Close
                          </button>
                          <button
                            type="button"
                            onClick={() => void printWorkOrder(workOrder.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-100"
                          >
                            <Printer size={14} />
                            Print
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

        {selectedWorkOrder ? (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm">
            <aside className="work-order-drawer-enter ml-auto flex h-full w-full max-w-3xl flex-col border-l border-slate-800 bg-slate-950 shadow-2xl shadow-black/50">
              <div className="border-b border-slate-800 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                      {selectedWorkOrder.workOrderId}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-white">
                      {selectedWorkOrder.machineName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {selectedWorkOrder.machineId} - {selectedWorkOrder.department}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedWorkOrder(null)}
                    aria-label="Close work order"
                    className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${priorityClasses[selectedWorkOrder.priority]}`}
                  >
                    {selectedWorkOrder.priority}
                  </span>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses[selectedWorkOrder.status]}`}
                  >
                    {formatStatus(selectedWorkOrder.status)}
                  </span>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                {isDetailLoading ? (
                  <div className="flex min-h-52 items-center justify-center">
                    <Loader2 className="animate-spin text-cyan-300" size={34} />
                  </div>
                ) : (
                  <div className="space-y-5">
                    <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-4">
                        <p className="text-xs uppercase text-slate-500">
                          Engineer
                        </p>
                        <p className="mt-2 font-semibold text-white">
                          {selectedWorkOrder.assignedEngineer || "Unassigned"}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-4">
                        <p className="text-xs uppercase text-slate-500">
                          Due Date
                        </p>
                        <p className="mt-2 font-semibold text-white">
                          {formatDate(selectedWorkOrder.dueDate)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-4">
                        <p className="text-xs uppercase text-slate-500">
                          Cost
                        </p>
                        <p className="mt-2 font-semibold text-white">
                          {formatCurrency(selectedWorkOrder.estimatedRepairCost)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-4">
                        <p className="text-xs uppercase text-slate-500">
                          Type
                        </p>
                        <p className="mt-2 font-semibold text-white">
                          {selectedWorkOrder.maintenanceType}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-4">
                        <p className="text-xs uppercase text-slate-500">
                          Approval
                        </p>
                        <p className="mt-2 font-semibold text-white">
                          {selectedWorkOrder.approvalStatus}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-4">
                        <p className="text-xs uppercase text-slate-500">
                          Hours
                        </p>
                        <p className="mt-2 font-semibold text-white">
                          {selectedWorkOrder.actualHours || 0} /{" "}
                          {selectedWorkOrder.estimatedHours ||
                            selectedWorkOrder.estimatedDowntimeHours}
                        </p>
                      </div>
                    </section>

                    <section className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                      <h3 className="flex items-center gap-2 font-bold text-white">
                        <FileText size={18} className="text-cyan-300" />
                        AI Prediction
                      </h3>
                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase text-slate-500">
                            Probable Cause
                          </p>
                          <p className="mt-2 text-sm text-slate-300">
                            {selectedWorkOrder.probableCause || "Pending analysis"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase text-slate-500">
                            Recommendation
                          </p>
                          <p className="mt-2 text-sm text-slate-300">
                            {selectedWorkOrder.aiRecommendation ||
                              "No recommendation attached"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
                        {selectedWorkOrder.description}
                      </div>
                    </section>

                    <section className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                      <h3 className="flex items-center gap-2 font-bold text-white">
                        <Save size={18} className="text-cyan-300" />
                        Actions
                      </h3>
                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_190px_auto]">
                        <input
                          value={engineerDraft}
                          onChange={(event) => setEngineerDraft(event.target.value)}
                          placeholder="Assigned engineer"
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                        />
                        <select
                          value={statusDraft}
                          onChange={(event) =>
                            setStatusDraft(event.target.value as WorkOrderStatus)
                          }
                          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {formatStatus(status)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            void saveSelectedWorkOrder({
                              assignedEngineer: engineerDraft,
                              status: statusDraft,
                            })
                          }
                          disabled={isSaving}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSaving ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Save size={16} />
                          )}
                          Save
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                        <textarea
                          value={noteDraft}
                          onChange={(event) => setNoteDraft(event.target.value)}
                          placeholder="Add technician note"
                          rows={3}
                          className="resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            void saveSelectedWorkOrder({
                              note: noteDraft,
                              author: "Operator",
                            })
                          }
                          disabled={isSaving || noteDraft.trim().length === 0}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-100 transition-colors hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <MessageSquare size={16} />
                          Add Note
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void closeWorkOrder(selectedWorkOrder)}
                          disabled={selectedWorkOrder.status === "COMPLETED"}
                          className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckCircle2 size={16} />
                          Close Work Order
                        </button>
                        <button
                          type="button"
                          onClick={() => void printWorkOrder(selectedWorkOrder.id)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/60 px-4 py-2 text-sm font-semibold text-slate-100 transition-colors hover:border-cyan-400/40 hover:bg-cyan-500/10"
                        >
                          <Printer size={16} />
                          Print Work Order
                        </button>
                      </div>
                    </section>

                    <section className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                      <h3 className="flex items-center gap-2 font-bold text-white">
                        <CheckCircle2 size={18} className="text-emerald-300" />
                        Maintenance Checklist
                      </h3>
                      <div className="mt-4 space-y-2">
                        {selectedWorkOrder.checklist.length === 0 ? (
                          <p className="text-sm text-slate-400">
                            No checklist items.
                          </p>
                        ) : (
                          selectedWorkOrder.checklist.map((item, index) => (
                            <label
                              key={`${item.label}-${index}`}
                              className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-200"
                            >
                              <input
                                checked={item.completed}
                                onChange={(event) => {
                                  const checklist = selectedWorkOrder.checklist.map(
                                    (currentItem, currentIndex) =>
                                      currentIndex === index
                                        ? {
                                            ...currentItem,
                                            completed: event.target.checked,
                                          }
                                        : currentItem
                                  );

                                  void saveSelectedWorkOrder({ checklist });
                                }}
                                type="checkbox"
                                className="h-4 w-4 accent-cyan-400"
                              />
                              <span>{item.label}</span>
                            </label>
                          ))
                        )}
                      </div>
                    </section>

                    <section className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                      <h3 className="flex items-center gap-2 font-bold text-white">
                        <AlertTriangle size={18} className="text-red-300" />
                        Notification History
                      </h3>
                      <div className="mt-4 space-y-3">
                        {selectedWorkOrder.notificationHistory.length === 0 ? (
                          <p className="text-sm text-slate-400">
                            No linked notifications.
                          </p>
                        ) : (
                          selectedWorkOrder.notificationHistory.map(
                            (notification) => (
                              <div
                                key={`${notification.notificationId}-${notification.createdAt}`}
                                className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p className="font-semibold text-white">
                                    {notification.title}
                                  </p>
                                  <span className="rounded-full border border-red-400/30 bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-200">
                                    {notification.severity}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm text-slate-300">
                                  {notification.message}
                                </p>
                                <p className="mt-2 text-xs text-slate-500">
                                  {formatDate(notification.createdAt)}
                                </p>
                              </div>
                            )
                          )
                        )}
                      </div>
                    </section>

                    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                        <h3 className="flex items-center gap-2 font-bold text-white">
                          <History size={18} className="text-cyan-300" />
                          Timeline
                        </h3>
                        <div className="mt-4 space-y-3">
                          {selectedWorkOrder.history.map((item, index) => (
                            <div key={`${item.event}-${item.at}-${index}`} className="flex gap-3">
                              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-300" />
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {item.event.replaceAll("_", " ")}
                                </p>
                                <p className="text-sm text-slate-400">
                                  {item.message || `${item.from || ""} ${item.to || ""}`}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {formatDate(item.at)} - {item.actor}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-900/75 p-5">
                        <h3 className="flex items-center gap-2 font-bold text-white">
                          <MessageSquare size={18} className="text-cyan-300" />
                          Notes
                        </h3>
                        <div className="mt-4 space-y-3">
                          {selectedWorkOrder.notes.length === 0 ? (
                            <p className="text-sm text-slate-400">
                              No notes added.
                            </p>
                          ) : (
                            selectedWorkOrder.notes.map((note) => (
                              <div
                                key={note.id}
                                className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                              >
                                <p className="text-sm text-slate-300">
                                  {note.text}
                                </p>
                                <p className="mt-2 text-xs text-slate-500">
                                  {note.author} - {formatDate(note.createdAt)}
                                </p>
                              </div>
                            ))
                          )}
                        </div>

                        <h3 className="mt-6 flex items-center gap-2 font-bold text-white">
                          <Paperclip size={18} className="text-cyan-300" />
                          Attachments
                        </h3>
                        <div className="mt-4 space-y-3">
                          {selectedWorkOrder.attachments.length === 0 ? (
                            <p className="text-sm text-slate-400">
                              No attachments.
                            </p>
                          ) : (
                            selectedWorkOrder.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.url}
                                className="block rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-sm font-semibold text-cyan-200 transition-colors hover:border-cyan-400/40"
                              >
                                {attachment.name}
                              </a>
                            ))
                          )}
                        </div>
                      </div>
                    </section>
                  </div>
                )}
              </div>
            </aside>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
