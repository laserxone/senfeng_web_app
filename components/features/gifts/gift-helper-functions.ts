export function formatGiftStatus(status: string) {
  return status.replace(/_/g, " ");
}

export function formatGiftDate(value: string) {
  return new Date(value).toLocaleDateString();
}
