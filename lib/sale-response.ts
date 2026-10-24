export function saleResponse<T extends Record<string, unknown>>(sale: T) {
  const response = { ...sale };
  delete response.cancelled;
  return response;
}
