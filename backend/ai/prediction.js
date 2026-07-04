function predictMachine(machine) {
  let risk = "Low";
  let priority = "Low";
  let recommendation = "Machine is healthy.";
  let maintenanceDays = 30;

  if (
    machine.health < 40 ||
    machine.temperature > 90 ||
    machine.status === "Critical"
  ) {
    risk = "High";
    priority = "Immediate";
    maintenanceDays = 1;
    recommendation =
      "High probability of failure. Shut down and inspect immediately.";
  } else if (
    machine.health < 70 ||
    machine.temperature > 75 ||
    machine.status === "Warning"
  ) {
    risk = "Medium";
    priority = "Soon";
    maintenanceDays = 7;
    recommendation =
      "Schedule preventive maintenance.";
  }

  return {
    failureRisk: risk,
    maintenancePriority: priority,
    maintenanceInDays: maintenanceDays,
    recommendation,
  };
}

export default predictMachine;
