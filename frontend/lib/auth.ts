import { useMemo, useSyncExternalStore } from "react";

export interface StoredUser {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  organizationId?: string;
  plantIds?: string[];
  activePlantId?: string;
}

const roleAliases: Record<string, string> = {
  Admin: "Super Admin",
  "Maintenance Engineer": "Engineer",
  "Plant Manager": "Plant Admin",
};

export const normalizeRole = (role?: string) =>
  role ? roleAliases[role] || role : "Viewer";

export const getStoredUser = (): StoredUser | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = localStorage.getItem("user");

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    return null;
  }
};

export const hasAnyRole = (role: string | undefined, allowedRoles: string[]) => {
  const normalizedRole = normalizeRole(role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  return (
    normalizedAllowedRoles.includes(normalizedRole) ||
    (normalizedRole === "Maintenance Manager" &&
      normalizedAllowedRoles.includes("Engineer"))
  );
};

export const hasToken = () =>
  typeof window !== "undefined" && Boolean(localStorage.getItem("token"));

const subscribeToAuthStorage = (onStoreChange: () => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === "user" ||
      event.key === "token" ||
      event.key === "refreshToken" ||
      event.key === null
    ) {
      onStoreChange();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener("kavach:auth-changed", onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("kavach:auth-changed", onStoreChange);
  };
};

const getStoredUserSnapshot = () =>
  typeof window === "undefined" ? null : localStorage.getItem("user");

const getServerStoredUserSnapshot = () => null;

const getStoredTokenSnapshot = () =>
  typeof window === "undefined" ? null : localStorage.getItem("token");

const getServerStoredTokenSnapshot = () => null;

export const useStoredUser = () => {
  const rawUser = useSyncExternalStore(
    subscribeToAuthStorage,
    getStoredUserSnapshot,
    getServerStoredUserSnapshot
  );

  return useMemo(() => {
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as StoredUser;
    } catch {
      return null;
    }
  }, [rawUser]);
};

export const useStoredToken = () =>
  useSyncExternalStore(
    subscribeToAuthStorage,
    getStoredTokenSnapshot,
    getServerStoredTokenSnapshot
  );
