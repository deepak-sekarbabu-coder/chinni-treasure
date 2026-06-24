const UPI_SCHEME = "upi://pay";

export function buildUpiPaymentUrl(
    upiId: string,
    merchantName: string,
    amount?: number,
    transactionNote = "Order Payment"
): string {
    const params = new URLSearchParams();
    params.set("pa", upiId);
    params.set("pn", merchantName);
    params.set("cu", "INR");

    if (typeof amount === "number" && Number.isFinite(amount)) {
        params.set("am", amount.toFixed(2));
    }

    if (transactionNote) {
        params.set("tn", transactionNote);
    }

    const encoded = params.toString().replace(/\+/g, "%20");
    return `${UPI_SCHEME}?${encoded}`;
}
