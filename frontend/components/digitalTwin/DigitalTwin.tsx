import FactoryScene from "@/components/3d/FactoryScene";
export default function DigitalTwin() {
  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: "16px",
        padding: "24px",
        minHeight: "400px",
        color: "white",
      }}
    >
      <h2 style={{ marginBottom: "12px" }}>🏭 Digital Twin</h2>

      <p style={{ color: "#9ca3af" }}>
        3D Industrial Plant Visualization
      </p>

      <div
        style={{
          height: "500px",
          width: "100%"
        }}
      >
        <FactoryScene />
      </div>
    </div>
  );
}