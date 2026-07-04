"use client";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function MachineInfoPanel({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 30,
        right: 30,
        width: 320,
        background: "#111827",
        border: "1px solid #334155",
        borderRadius: 16,
        padding: 20,
        color: "white",
        zIndex: 100,
      }}
    >
      <h2 style={{ fontSize: 22, fontWeight: "bold" }}>
        Machine-01
      </h2>

      <hr style={{ margin: "12px 0" }} />

      <p>🟢 Status : Running</p>
      <p>🌡 Temperature : 54°C</p>
      <p>⚙ RPM : 1450</p>
      <p>💚 Health : 98%</p>
      <p>🔋 Power : 22 kW</p>

      <div
        style={{
          marginTop: 20,
          background: "#0f766e",
          padding: 12,
          borderRadius: 10,
        }}
      >
        AI Prediction

        <br />

        Bearing Healthy

        <br />

        Next Maintenance:
        14 Days
      </div>

      <button
        onClick={onClose}
        style={{
          marginTop: 20,
          width: "100%",
          padding: 10,
          borderRadius: 10,
          background: "#2563eb",
        }}
      >
        Close
      </button>
    </div>
  );
}