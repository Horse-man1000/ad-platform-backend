export function normalizePlatform(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

export function maskToken(value) {
  if (!value || value.length < 8) {
    return "***";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}