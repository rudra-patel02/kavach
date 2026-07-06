export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "KAVACH Enterprise API",
    version: "18.0.0",
    description:
      "Industrial Decision Intelligence APIs for auth, telemetry, plants, work orders, notifications, RBAC, reports, audit, and monitoring.",
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
      WorkOrder: {
        properties: {
          assignedEngineer: { type: "string" },
          checklist: { type: "array" },
          costEstimate: { type: "number" },
          machineId: { type: "string" },
          machineName: { type: "string" },
          maintenanceType: { type: "string" },
          priority: { type: "string" },
          scheduledDate: { format: "date-time", type: "string" },
          status: { type: "string" },
          workOrderId: { type: "string" },
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
    "/audit/export/{format}": {
      get: {
        summary: "Export audit logs as CSV, Excel-compatible CSV, or PDF",
        parameters: [
          { in: "path", name: "format", required: true, schema: { enum: ["csv", "excel", "pdf"], type: "string" } },
        ],
        responses: { 200: { description: "Audit export" } },
      },
    },
    "/notifications": {
      get: {
        summary: "List notifications with filters and cursor pagination",
        responses: { 200: { description: "Notification page" } },
      },
      post: {
        summary: "Create a notification",
        responses: { 201: { description: "Notification created" } },
      },
    },
    "/notifications/{id}/archive": {
      patch: {
        summary: "Archive or unarchive a notification",
        responses: { 200: { description: "Notification updated" } },
      },
    },
    "/notifications/preferences": {
      get: {
        summary: "Read notification preferences",
        responses: { 200: { description: "Notification preferences" } },
      },
      patch: {
        summary: "Update notification preferences",
        responses: { 200: { description: "Notification preferences updated" } },
      },
    },
    "/users": {
      get: {
        summary: "List users and RBAC roles",
        responses: { 200: { description: "User directory" } },
      },
      post: {
        summary: "Create a managed user",
        responses: { 201: { description: "User created" } },
      },
    },
    "/users/{id}": {
      patch: {
        summary: "Update user role, status, permissions, or profile",
        responses: { 200: { description: "User updated" } },
      },
      delete: {
        summary: "Delete a user",
        responses: { 200: { description: "User deleted" } },
      },
    },
    "/workorders": {
      get: {
        summary: "List work orders",
        responses: { 200: { description: "Work order list" } },
      },
      post: {
        summary: "Create a work order",
        responses: { 201: { description: "Work order created" } },
      },
    },
    "/workorders/{id}/assign": {
      patch: {
        summary: "Assign a work order",
        responses: { 200: { description: "Work order assigned" } },
      },
    },
    "/workorders/{id}/complete": {
      patch: {
        summary: "Complete a work order",
        responses: { 200: { description: "Work order completed" } },
      },
    },
    "/workorders/{id}/status": {
      patch: {
        summary: "Update work order status",
        responses: { 200: { description: "Work order status updated" } },
      },
    },
    "/workorders/export/{format}": {
      get: {
        summary: "Export work orders as CSV, Excel-compatible CSV, or PDF",
        parameters: [
          { in: "path", name: "format", required: true, schema: { enum: ["csv", "excel", "pdf"], type: "string" } },
        ],
        responses: { 200: { description: "Work order export" } },
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
