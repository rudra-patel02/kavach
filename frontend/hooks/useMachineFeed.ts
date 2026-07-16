"use client";

import { useEffect, useSyncExternalStore } from "react";
import { fetchMachines } from "@/lib/machines";
import socket from "@/lib/socket";
import type { MachineData } from "@/types/machine";

let machinesSnapshot: MachineData[] = [];
let loadPromise: Promise<void> | null = null;
let socketSubscribed = false;
const listeners = new Set<() => void>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

const setMachinesSnapshot = (nextMachines: MachineData[]) => {
  machinesSnapshot = nextMachines;
  emitChange();
};

const loadMachines = () => {
  if (!loadPromise) {
    loadPromise = fetchMachines()
      .then(setMachinesSnapshot)
      .catch(() => setMachinesSnapshot([]))
      .finally(() => {
        loadPromise = null;
      });
  }

  return loadPromise;
};

const handleMachineUpdate = (nextMachines: MachineData[]) => {
  setMachinesSnapshot(nextMachines);
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  if (!socketSubscribed) {
    socket.on("machineUpdate", handleMachineUpdate);
    socketSubscribed = true;
  }

  if (machinesSnapshot.length === 0) {
    void loadMachines();
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && socketSubscribed) {
      socket.off("machineUpdate", handleMachineUpdate);
      socketSubscribed = false;
    }
  };
};

const getSnapshot = () => machinesSnapshot;
const getServerSnapshot = () => [];

export const useMachineFeed = () => {
  const machines = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    if (machines.length === 0) {
      void loadMachines();
    }
  }, [machines.length]);

  return machines;
};
