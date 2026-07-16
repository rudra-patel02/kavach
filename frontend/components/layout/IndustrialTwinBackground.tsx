"use client";

export default function IndustrialTwinBackground() {
  return (
    <div className="industrial-twin-bg" aria-hidden="true">
      <div className="industrial-twin-sky" />
      <div className="industrial-twin-silhouette">
        <span className="factory-block factory-block-1" />
        <span className="factory-block factory-block-2" />
        <span className="factory-block factory-block-3" />
        <span className="factory-block factory-block-4" />
        <span className="factory-stack factory-stack-1" />
        <span className="factory-stack factory-stack-2" />
        <span className="factory-pipe factory-pipe-1" />
        <span className="factory-pipe factory-pipe-2" />
      </div>
      <div className="industrial-twin-vignette" />
      <div className="industrial-twin-hud">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
