import React from "react";

export default function CurrencyFormatter({ amount, showDecimals = false, showPKR = true }) {
  const numericValue = parseFloat(amount);

  // Check if it's a valid number after conversion
  if (isNaN(numericValue)) {
    return <>{showPKR && "PKR "}0</>;
  }

  let formattedValue = showDecimals
    ? numericValue.toFixed(2)
    : numericValue.toString().split(".")[0];

  // Add comma separators (for thousands)
  formattedValue = formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return <>{showPKR && "PKR "}{formattedValue}</>;
}
