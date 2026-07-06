export class AppError extends Error {
  constructor(message, statusCode = 500, details = undefined) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const getStatusCode = (error) => {
  if (error.message === "Origin is not allowed by CORS") {
    return 403;
  }

  if (error.statusCode) {
    return error.statusCode;
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return 400;
  }

  if (error.code === 11000) {
    return 409;
  }

  return 500;
};

const serializeValidationError = (error) => {
  if (error.name === "ValidationError") {
    return Object.values(error.errors || {}).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  }

  if (error.name === "CastError") {
    return [
      {
        field: error.path,
        message: `Invalid ${error.path}`,
      },
    ];
  }

  if (error.code === 11000) {
    return Object.keys(error.keyPattern || {}).map((field) => ({
      field,
      message: `${field} must be unique`,
    }));
  }

  return error.details;
};

export const globalErrorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = getStatusCode(error);
  const isProduction = process.env.NODE_ENV === "production";
  const message =
    statusCode >= 500 && isProduction
      ? "Internal server error"
      : error.message || "Internal server error";
  const payload = {
    message,
    requestId: req.id,
    success: false,
  };
  const details = serializeValidationError(error);

  if (details) {
    payload.details = details;
  }

  if (!isProduction && error.stack) {
    payload.stack = error.stack;
  }

  const logPayload = {
    error: error.message,
    method: req.method,
    path: req.originalUrl,
    requestId: req.id,
    stack: error.stack,
    statusCode,
    userId: req.user?.id,
  };

  console[statusCode >= 500 ? "error" : "warn"](
    JSON.stringify({
      level: statusCode >= 500 ? "error" : "warn",
      message: "request_error",
      service: "kavach-backend",
      timestamp: new Date().toISOString(),
      ...logPayload,
    })
  );

  res.status(statusCode).json(payload);
};
