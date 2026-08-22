"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useFocusTrap } from "@/src/lib/useFocusTrap";

const SHOW_DELAY_MS = 600;
const AUTO_DISMISS_MS = 6000;
const EXIT_MS = 300;
const SESSION_SHOWN_KEY = "gift-popup-shown";

const COMPLEMENTARY_GIFTS = [
  {
    icon: "\u2662",
    title: "Handwritten Note",
    desc: "A personal thank-you note from our studio in every parcel.",
  },
  {
    icon: "\u25c8",
    title: "Customized Notes for Gift Recipients",
    desc: "Gifting? We'll personalize a handwritten note with your message, addressed just for your recipient.",
  },
];

export default function ComplementaryGiftPopup() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const trapRef = useFocusTrap(visible && !leaving);

  const dismiss = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(() => setVisible(false), EXIT_MS);
  }, [leaving]);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    // The popup is a full-screen modal: showing it on every navigation made
    // pages (e.g. /catalogue) feel frozen. Show it at most once per session.
    try {
      if (window.sessionStorage.getItem(SESSION_SHOWN_KEY)) return;
    } catch {
      // Storage unavailable – fall through and show as usual.
    }
    const timer = window.setTimeout(() => {
      try {
        window.sessionStorage.setItem(SESSION_SHOWN_KEY, "1");
      } catch {
        // ignore
      }
      setVisible(true);
    }, SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!visible || leaving) return;
    const timer = window.setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [visible, leaving, dismiss]);

  if (!visible) return null;

  return (
    <div
      className={`gift-popup-overlay${leaving ? " leaving" : ""}`}
      ref={trapRef}
      onClick={dismiss}
      onKeyDown={(e) => {
        if (e.key === "Escape") dismiss();
      }}
    >
      <div
        className="gift-popup-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-popup-title"
        aria-describedby="gift-popup-copy"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="gift-popup-close"
          onClick={dismiss}
          aria-label="Close gift popup"
        >
          &#x2715;
        </button>
        <div className="gift-popup-handle" aria-hidden="true" />
        <div className="gift-popup-seal" aria-hidden="true">
          &#x2726;
        </div>
        <p className="gift-popup-kicker">A little extra love</p>
        <h2 id="gift-popup-title">Every Order Comes With A Gift</h2>
        <p id="gift-popup-copy" className="gift-popup-copy">
          Complimentary, always — thoughtfully tucked into every single parcel.
        </p>

        <ul className="gift-popup-list">
          {COMPLEMENTARY_GIFTS.map((gift) => (
            <li key={gift.title} className="gift-popup-item">
              <span className="gift-popup-item-icon" aria-hidden="true">
                {gift.icon}
              </span>
              <div className="gift-popup-item-body">
                <h3>{gift.title}</h3>
                <p>{gift.desc}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="gift-popup-actions">
          <Link
            href="/catalogue"
            className="btn btn-primary btn-full btn-tall"
            onClick={dismiss}
          >
            Shop The Collection
          </Link>
        </div>
      </div>
    </div>
  );
}
