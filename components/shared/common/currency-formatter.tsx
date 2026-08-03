export default function CurrencyFormatter({
  amount,
  showDecimals = false,
  showPKR = true,
}: {
  amount: number | string
  showDecimals?: boolean
  showPKR?: boolean
}) {
  const numericValue = typeof amount === "string" ? parseFloat(amount) : amount

  // Check if it's a valid number after conversion
  if (isNaN(numericValue)) {
    return <>{showPKR && "PKR "}0</>
  }

  let formattedValue = showDecimals
    ? numericValue.toFixed(2)
    : numericValue.toString().split(".")[0]

  // Add comma separators (for thousands)
  formattedValue = formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",")

  return (
    <>
      {showPKR && "PKR "}
      {formattedValue}
    </>
  )
}
