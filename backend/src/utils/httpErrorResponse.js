const isMongoConnectionError = (error) =>
  [
    "MongoNetworkError",
    "MongoServerSelectionError",
    "MongooseServerSelectionError",
    "MongooseTimeoutError",
  ].includes(error?.name) ||
  /topology was destroyed|buffering timed out|server selection timed out|could not connect/i.test(
    error?.message || ""
  );

export const getHttpStatusForError = (error) => {
  if (error?.statusCode) {
    return error.statusCode;
  }

  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return 400;
  }

  if (error?.code === 11000) {
    return 409;
  }

  if (isMongoConnectionError(error)) {
    return 503;
  }

  return 500;
};

export const getErrorDetails = (error) => {
  if (error?.details) {
    return error.details;
  }

  if (error?.name === "ValidationError") {
    return Object.values(error.errors || {}).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  }

  if (error?.name === "CastError") {
    return [
      {
        field: error.path,
        message: `Invalid ${error.path}`,
      },
    ];
  }

  if (error?.code === 11000) {
    return Object.keys(error.keyPattern || error.keyValue || {}).map((field) => ({
      field,
      message: `${field} must be unique`,
    }));
  }

  return undefined;
};

export const sendErrorResponse = (
  res,
  error,
  {
    fallbackMessage = "Request failed",
    includeDetails = true,
    success = false,
  } = {}
) => {
  const statusCode = getHttpStatusForError(error);
  const payload = {
    message:
      statusCode >= 500
        ? fallbackMessage
        : error?.message || fallbackMessage,
    success,
  };
  const details = includeDetails ? getErrorDetails(error) : undefined;

  if (details) {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
};
