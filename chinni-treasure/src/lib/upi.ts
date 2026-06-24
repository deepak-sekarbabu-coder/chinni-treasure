const UPI_SCHEME = "upi://pay";

/**
 * Generate a unique transaction reference for each payment attempt.
 * Format: CT-{timestamp}-{random hex}
 */
function generateTransactionRef(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = crypto.randomUUID().slice(0, 8).toUpperCase();
    return `CT${ts}${rand}`;
}

/**
 * Build a NPCI v1.6 compliant UPI deep-link URL.
 *
 * @param upiId - The UPI VPA (e.g. "9499011029@ibl")
 * @param merchantName - Business name shown in the UPI app
 * @param amount - Optional payment amount (pre-fills in the UPI app)
 * @param transactionNote - Note shown to the user (default "Order Payment")
 * @param merchantCode - 4-digit ISO Merchant Category Code (default "5411" = Grocery/Supermarkets)
 * @param transactionRef - Unique transaction reference; auto-generated if omitted
 */
export function buildUpiPaymentUrl(
    upiId: string,
    merchantName: string,
    amount?: number,
    transactionNote = "Order Payment",
    merchantCode = "5411",
    transactionRef?: string,
): string {
    const params = new URLSearchParams();
    params.set("pa", upiId);
    params.set("pn", merchantName);
    params.set("cu", "INR");
    // mode=04 = in-app deep link (NOT a camera scan). Avoids PhonePe anti-phishing block.
    params.set("mode", "04");

    // Merchant Category Code — required when pre-filling a commercial amount
    params.set("mc", merchantCode);

    // Unique transaction reference — mandatory per NPCI for locked-amount intents
    params.set("tr", transactionRef ?? generateTransactionRef());

    if (typeof amount === "number" && Number.isFinite(amount) && amount > 0) {
        params.set("am", amount.toFixed(2));
    }

    if (transactionNote) {
        params.set("tn", transactionNote);
    }

    const encoded = params.toString().replace(/\+/g, "%20");
    return `${UPI_SCHEME}?${encoded}`;
}
