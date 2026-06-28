"use client";

import { useState } from "react";
import ReturnsPolicyModal from "@/src/components/ui/ReturnsPolicyModal";

export default function FooterClientWrapper() {
  const [returnsPolicyOpen, setReturnsPolicyOpen] = useState(false);

  return (
    <>
      <button className="footer-link-btn" onClick={() => setReturnsPolicyOpen(true)}>
        Return Policy
      </button>
      <ReturnsPolicyModal open={returnsPolicyOpen} onClose={() => setReturnsPolicyOpen(false)} />
    </>
  );
}
