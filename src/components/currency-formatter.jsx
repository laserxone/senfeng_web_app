import React from "react";

export default function CurrencyFormatter({ amount, showDecimals = false }) {
  const numericValue = parseFloat(amount);

  // Check if it's a valid number after conversion
  if (isNaN(numericValue)) {
    return <>0 PKR</>;
  }

  let formattedValue = showDecimals
    ? numericValue.toFixed(2)
    : numericValue.toString().split(".")[0];

  // Add comma separators (for thousands)
  formattedValue = formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return <>PKR {formattedValue}</>;
}
