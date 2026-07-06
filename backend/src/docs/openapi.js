export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "KAVACH Enterprise API",
    version: "12.0.0",
    description:
      "Industrial Decision Intelligence APIs for auth, telemetry, plants, reports, audit, and monitoring.",
  },
  servers: [{ url: "/api" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        bearerFormat: "JWT",
        scheme: "bearer",
        type: "http",
      },
    },
    schemas: {
      ApiError: {
        properties: {
          message: { type: "string" },
          success: { type: "boolean" },
        },
        type: "object",
      },
      Machine: {
        properties: {
          machineId: { type: "string" },
          name: { type: "string" },
          plantId: { type: "string" },
          status: { type: "string" },
          temperature: { type: "number" },
        },
        type: "object",
      },
      TelemetryPayload: {
        properties: {
          current: { type: "number" },
          deviceId: { type: "string" },
          energy: { type: "number" },
          humidity: { type: "number" },
          machineId: { type: "string" },
          pressure: { type: "number" },
          temperature: { type: "number" },
          timestamp: { format: "date-time", type: "string" },
          vibration: { type: "number" },
          voltage: { type: "number" },
        },
        required: ["deviceId", "machineId"],
        type: "object",
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/login": {
      post: {
        summary: "Authenticate user",
        responses: { 200: { description: "Login successful" } },
      },
    },
    "/machines": {
      get: {
        summary: "List machines",
        responses: { 200: { description: "Machine list" } },
      },
      post: {
        summary: "Create machine",
        responses: { 201: { description: "Machine created" } },
      },
    },
    "/iot/telemetry": {
      post: {
        summary: "Ingest device telemetry",
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TelemetryPayload" },
            },
          },
        },
        responses: { 202: { description: "Telemetry accepted" } },
      },
    },
    "/tenants": {
      get: {
        summary: "Tenant hierarchy overview",
        responses: { 200: { description: "Tenant overview" } },
      },
    },
    "/reports/{type}": {
      get: {
        summary: "Generate report",
        parameters: [
          { in: "path", name: "type", required: true, schema: { type: "string" } },
          { in: "query", name: "format", schema: { enum: ["json", "pdf", "csv", "excel"], type: "string" } },
        ],
        responses: { 200: { description: "Generated report" } },
      },
    },
    "/audit": {
      get: {
        summary: "Audit log search",
        responses: { 200: { description: "Audit logs" } },
      },
    },
    "/system/health": {
      get: {
        summary: "System health and diagnostics",
        responses: { 200: { description: "System health" } },
      },
    },
  },
};
