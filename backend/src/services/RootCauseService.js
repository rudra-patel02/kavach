import {
  SENSOR_CONFIG,
  clamp,
  round,
} from "./AIConfig.js";

const get = (telemetry, key, fallback = 0) => {
  const value = Number(telemetry[key]);
  return Number.isFinite(value) ? value : fallback;
};

const addEvidence = (evidence, condition, text, weight) => {
  if (condition) {
    evidence.push({ text, weight });
  }
};

const probabilityFromEvidence = (evidence, base = 8) =>
  clamp(
    base + evidence.reduce((total, item) => total + item.weight, 0),
    1,
    96
  );

const cause = ({
  cause: name,
  evidence,
  explanation,
  correctiveActions,
  base,
}) => ({
  cause: name,
  probability: round(probabilityFromEvidence(evidence, base), 1),
  explanation,
  correctiveActions,
  evidence: evidence.map((item) => item.text),
});

export const analyzeRootCauses = ({
  telemetry = {},
  anomaly,
  machine = {},
} = {}) => {
  const temperature = get(telemetry, "temperature", machine.temperature);
  const vibration = get(telemetry, "vibration", machine.vibration);
  const current = get(telemetry, "current", machine.current);
  const voltage = get(telemetry, "voltage", machine.voltage || 415);
  const pressure = get(telemetry, "pressure", machine.pressure || 1.1);
  const rpm = get(telemetry, "rpm", machine.rpm || 1450);
  const oilLevel = get(telemetry, "oilLevel", machine.oilLevel ?? 100);
  const humidity = get(telemetry, "humidity", machine.humidity || 45);
  const energy = get(telemetry, "energy", machine.energyConsumed || machine.power);
  const abnormalSensors = new Set(
    (anomaly?.sensors || [])
      .filter((sensor) => sensor.status && sensor.status !== "Normal")
      .map((sensor) => sensor.sensor)
  );
  const hasSpike = (sensor) => anomaly?.spikeDetections?.includes(sensor);
  const hasDrift = (sensor) => anomaly?.driftDetections?.includes(sensor);
  const highTemperature = temperature >= SENSOR_CONFIG.temperature.warningHigh;
  const highVibration = vibration >= SENSOR_CONFIG.vibration.warningHigh;
  const veryHighVibration = vibration >= SENSOR_CONFIG.vibration.criticalHigh;
  const highCurrent = current >= SENSOR_CONFIG.current.warningHigh;
  const lowVoltage = voltage <= SENSOR_CONFIG.voltage.warningLow;
  const pressureAbnormal =
    pressure >= SENSOR_CONFIG.pressure.warningHigh ||
    pressure <= SENSOR_CONFIG.pressure.warningLow;
  const lowOil = oilLevel <= SENSOR_CONFIG.oilLevel.warningLow;
  const rpmAbnormal =
    rpm <= SENSOR_CONFIG.rpm.warningLow || rpm >= SENSOR_CONFIG.rpm.warningHigh;
  const highHumidity = humidity >= SENSOR_CONFIG.humidity.warningHigh;
  const highEnergy = energy >= SENSOR_CONFIG.energy.warningHigh;

  const bearingEvidence = [];
  addEvidence(bearingEvidence, highVibration, "High vibration signature", 24);
  addEvidence(bearingEvidence, veryHighVibration, "Critical vibration amplitude", 14);
  addEvidence(bearingEvidence, highTemperature, "Heat rise around rotating assembly", 18);
  addEvidence(bearingEvidence, highCurrent, "Increasing motor current under load", 12);
  addEvidence(bearingEvidence, hasDrift("vibration"), "Vibration drift over recent samples", 14);

  const alignmentEvidence = [];
  addEvidence(alignmentEvidence, highVibration, "Persistent vibration outside normal band", 20);
  addEvidence(alignmentEvidence, rpmAbnormal, "RPM instability or speed deviation", 17);
  addEvidence(alignmentEvidence, highCurrent, "Current draw elevated during rotation", 10);
  addEvidence(alignmentEvidence, hasSpike("vibration"), "Sudden vibration spike", 12);

  const lubricationEvidence = [];
  addEvidence(lubricationEvidence, lowOil, "Oil level below operating band", 30);
  addEvidence(lubricationEvidence, highTemperature, "Thermal stress consistent with friction", 18);
  addEvidence(lubricationEvidence, highVibration, "Vibration rise under poor lubrication", 16);
  addEvidence(lubricationEvidence, hasDrift("oilLevel"), "Oil level is drifting down", 14);

  const overloadEvidence = [];
  addEvidence(overloadEvidence, highCurrent, "Motor current is elevated", 24);
  addEvidence(overloadEvidence, highEnergy, "Energy intensity is above expected band", 18);
  addEvidence(overloadEvidence, highTemperature, "Thermal load is increasing", 14);
  addEvidence(overloadEvidence, rpm < SENSOR_CONFIG.rpm.defaultValue * 0.82, "RPM drop suggests load drag", 14);

  const foundationEvidence = [];
  addEvidence(foundationEvidence, highVibration, "High vibration at asset level", 22);
  addEvidence(foundationEvidence, hasSpike("vibration"), "Vibration changed suddenly", 18);
  addEvidence(foundationEvidence, !highTemperature, "Vibration without matching heat rise", 8);

  const coolingEvidence = [];
  addEvidence(coolingEvidence, highTemperature, "Temperature is above warning band", 26);
  addEvidence(coolingEvidence, highHumidity, "Ambient humidity may reduce cooling efficiency", 10);
  addEvidence(coolingEvidence, !lowOil && !highVibration, "Heat rise without mechanical signature", 12);
  addEvidence(coolingEvidence, hasDrift("temperature"), "Temperature drift detected", 14);

  const hydraulicEvidence = [];
  addEvidence(hydraulicEvidence, pressureAbnormal, "Pressure outside hydraulic operating band", 30);
  addEvidence(hydraulicEvidence, lowOil, "Oil level can affect hydraulic pressure stability", 14);
  addEvidence(hydraulicEvidence, highTemperature, "Hydraulic fluid may be overheating", 10);
  addEvidence(hydraulicEvidence, hasSpike("pressure"), "Sudden pressure spike or drop", 14);

  const electricalEvidence = [];
  addEvidence(electricalEvidence, lowVoltage, "Voltage below expected supply band", 24);
  addEvidence(electricalEvidence, abnormalSensors.has("voltage"), "Voltage anomaly detected", 18);
  addEvidence(electricalEvidence, highCurrent, "Current draw is elevated", 16);
  addEvidence(electricalEvidence, hasSpike("current"), "Current spike detected", 14);

  const pumpEvidence = [];
  addEvidence(pumpEvidence, pressureAbnormal, "Pressure deviation affects pump performance", 20);
  addEvidence(pumpEvidence, highVibration, "Pump vibration is above normal", 16);
  addEvidence(pumpEvidence, highEnergy, "Pump energy demand is elevated", 12);
  addEvidence(pumpEvidence, rpmAbnormal, "Pump speed is outside normal band", 10);

  const causes = [
    cause({
      cause: "Bearing wear",
      evidence: bearingEvidence,
      base: 10,
      explanation:
        "The combination of vibration, heat, and current stress is consistent with bearing degradation.",
      correctiveActions: [
        "Run vibration spectrum analysis.",
        "Inspect bearing housing and replace bearings if wear is confirmed.",
        "Verify lubrication film and bearing temperature.",
      ],
    }),
    cause({
      cause: "Shaft misalignment",
      evidence: alignmentEvidence,
      base: 8,
      explanation:
        "Vibration with RPM or current instability suggests alignment drift across the drive train.",
      correctiveActions: [
        "Perform laser shaft alignment.",
        "Inspect couplings and soft-foot condition.",
        "Rebalance rotating components after alignment.",
      ],
    }),
    cause({
      cause: "Lubrication failure",
      evidence: lubricationEvidence,
      base: 8,
      explanation:
        "Low oil level plus thermal and vibration stress indicates friction from insufficient lubrication.",
      correctiveActions: [
        "Inspect lubrication level, viscosity, and contamination.",
        "Top up or replace lubricant.",
        "Check seals, leaks, and oil delivery path.",
      ],
    }),
    cause({
      cause: "Motor overload",
      evidence: overloadEvidence,
      base: 9,
      explanation:
        "High current, energy use, and temperature indicate the motor is operating above its stable load band.",
      correctiveActions: [
        "Reduce operating load where safe.",
        "Inspect driven equipment for mechanical drag.",
        "Validate motor sizing and drive parameters.",
      ],
    }),
    cause({
      cause: "Loose foundation",
      evidence: foundationEvidence,
      base: 6,
      explanation:
        "A vibration-led fault without strong thermal evidence often points to loose mounts or foundation issues.",
      correctiveActions: [
        "Inspect anchor bolts, base frame, and grout condition.",
        "Tighten mounts to specification.",
        "Check structural resonance after correction.",
      ],
    }),
    cause({
      cause: "Cooling failure",
      evidence: coolingEvidence,
      base: 7,
      explanation:
        "Thermal drift with limited mechanical evidence suggests cooling restriction or degraded heat transfer.",
      correctiveActions: [
        "Inspect fans, filters, cooling lines, and heat exchangers.",
        "Clean blocked cooling surfaces.",
        "Verify coolant flow and ambient ventilation.",
      ],
    }),
    cause({
      cause: "Hydraulic restriction",
      evidence: hydraulicEvidence,
      base: 7,
      explanation:
        "Pressure instability, oil condition, and heat point toward hydraulic blockage, leakage, or pump stress.",
      correctiveActions: [
        "Inspect filters, valves, seals, and pressure controls.",
        "Check hydraulic fluid level and contamination.",
        "Calibrate pressure sensors.",
      ],
    }),
    cause({
      cause: "Electrical supply issue",
      evidence: electricalEvidence,
      base: 7,
      explanation:
        "Voltage deviation with current spikes indicates supply imbalance, loose terminals, or drive faults.",
      correctiveActions: [
        "Check incoming voltage and phase balance.",
        "Inspect terminals, VFD, contactors, and protection devices.",
        "Review current waveform and harmonics.",
      ],
    }),
    cause({
      cause: "Pump degradation",
      evidence: pumpEvidence,
      base: 6,
      explanation:
        "Pressure deviation paired with vibration and energy stress indicates pump wear or flow restriction.",
      correctiveActions: [
        "Inspect impeller, seals, bearings, and suction conditions.",
        "Check inlet strainers and discharge valves.",
        "Validate pump curve against operating point.",
      ],
    }),
  ]
    .filter((item) => item.probability >= 12 || item.evidence.length > 0)
    .sort((a, b) => b.probability - a.probability);

  const topCauses = causes.slice(0, 5);
  const total = topCauses.reduce((sum, item) => sum + item.probability, 0) || 1;
  const normalizedCauses = topCauses.map((item) => ({
    ...item,
    probability: round((item.probability / total) * 100, 1),
  }));

  return {
    summary:
      normalizedCauses[0]?.cause ||
      "No dominant root-cause signature detected",
    confidence: round(
      clamp((anomaly?.confidence || 55) * 0.72 + normalizedCauses.length * 5, 45, 97),
      1
    ),
    causes: normalizedCauses,
    sensorSignature: {
      temperature,
      vibration,
      current,
      voltage,
      pressure,
      rpm,
      energy,
      oilLevel,
      humidity,
    },
  };
};
