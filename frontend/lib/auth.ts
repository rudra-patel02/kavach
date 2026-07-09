import { useMemo, useSyncExternalStore } from "react";

import type { AuthUser, Role } from "@/types";

export type StoredUser = AuthUser;

// v1 has exactly three server-owned roles. The UI never lets a user pick a role;
// it only reflects the one the server assigned.
export const ROLES: Role[] = ["Manager", "Engineer", "Viewer"];

export const getStoredUser = (): StoredUser | null => {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = localStorage.getItem("user");
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
};

export const hasToken = () =>
  typeof window !== "undefined" && Boolean(localStorage.getItem("token"));

export const isManager = (user?: StoredUser | null) => user?.role === "Manager";
export const isEngineer = (user?: StoredUser | null) => user?.role === "Engineer";

// Who may mutate work orders (Manager + Engineer). A Viewer only ever reads —
// the UI hides every mutation control from them.
export const canManageWorkOrders = (user?: StoredUser | null) =>
  user?.role === "Manager" || user?.role === "Engineer";

// Who may create work orders / acknowledge alerts / manage users (Manager only).
export const canManagePlant = (user?: StoredUser | null) => user?.role === "Manager";

const subscribe = (onChange: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handleStorage = (event: StorageEvent) => {
    if (event.key === "user" || event.key === "token" || event.key === null) {
      onChange();
    }
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener("kavach:auth-changed", onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("kavach:auth-changed", onChange);
  };
};

const getUserSnapshot = () =>
  typeof window === "undefined" ? null : localStorage.getItem("user");
const getServerUserSnapshot = () => null;

const getTokenSnapshot = () =>
  typeof window === "undefined" ? null : localStorage.getItem("token");
const getServerTokenSnapshot = () => null;

export const useStoredUser = () => {
  const raw = useSyncExternalStore(subscribe, getUserSnapshot, getServerUserSnapshot);
  return useMemo(() => {
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  }, [raw]);
};

export const useStoredToken = () =>
  useSyncExternalStore(subscribe, getTokenSnapshot, getServerTokenSnapshot);
