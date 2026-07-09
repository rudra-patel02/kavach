export default function PlantStatus() {
  const machines = [
    {
      name: "CNC Machine",
      status: "Running",
      color: "bg-green-500",
    },
    {
      name: "Compressor",
      status: "Warning",
      color: "bg-yellow-500",
    },
    {
      name: "Cooling Unit",
      status: "Stopped",
      color: "bg-red-500",
    },
    {
      name: "Assembly Line",
      status: "Running",
      color: "bg-green-500",
    },
  ];

  return (
    <div className="bg-[#111827] rounded-2xl p-6 shadow-lg">
      <h2 className="text-xl font-semibold mb-5 text-white">
        Plant Status
      </h2>

      <div className="space-y-4">
        {machines.map((machine) => (
          <div
            key={machine.name}
            className="flex justify-between items-center"
          >
            <span className="text-gray-300">
              {machine.name}
            </span>

            <div className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${machine.color}`}
              />

              <span className="text-sm text-gray-400">
                {machine.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}