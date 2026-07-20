

function formatCurrency(amount: string | number | null | undefined) {
    const numericAmount = Number(amount || 0)

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
    }).format(numericAmount)
}

function formatDate(dateString?: string | null) {
    if (!dateString) return "Not set"

    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    })
}

function formatDateTime(dateString?: string | null) {
    if (!dateString) return "Not set"

    return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

function formatStatus(status: string) {
    return status.replaceAll("_", " ")
}



export {formatCurrency, formatDate, formatDateTime, formatStatus}