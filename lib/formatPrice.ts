export const formatPrice = (price: string | number) => {
  const priceStr = String(price)

  if (priceStr.toUpperCase().includes("USD")) {
    return priceStr
  }

  const numeric = parseFloat(priceStr.replace(/[^0-9.]/g, ""))

  if (isNaN(numeric)) return "0"

  return (numeric / 1_000_000).toFixed(2)
}
