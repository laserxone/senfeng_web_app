export function generateLog(data) {
  const entries = Object.entries(data)
    .filter(([_, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value.join(", ")} `;
      }
      if (typeof value === "boolean") {
        return `${key}: ${value ? "true" : "false"} `;
      }
      return `${key}: ${value} `;
    });

  return `New customer added with the following details:\n${entries.join("\n")}`;
}
