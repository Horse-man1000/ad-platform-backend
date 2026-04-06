export function successResponse(module, message, data = null) {
  return {
    status: "ok",
    module,
    message,
    ...(data !== null ? { data } : {}),
  };
}

export function errorResponse(message, details = null) {
  return {
    status: "error",
    message,
    ...(details ? { details } : {}),
  };
}

export function placeholderResponse(module) {
  return successResponse(module, "placeholder route");
}
