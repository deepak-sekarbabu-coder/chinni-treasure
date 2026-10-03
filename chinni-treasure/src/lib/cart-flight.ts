"use client";

/**
 * The add-to-cart flight — the one authored focal moment.
 *
 * Adding to the cart is the only gesture on this site whose cause and effect
 * live in different places: the visitor presses a button on a card, and the
 * result happens in the navbar. Everything else either stays where it is or
 * announces itself with a pulse in place. This is the one place where the
 * relationship itself is worth showing, so the product's own image leaves the
 * card and arrives at the cart.
 *
 * It is a module rather than context because nothing needs to read state back
 * out of it. The card fires `launchCartFlight`, an overlay element carries the
 * image along an arc and removes itself when the animation ends, and the
 * navbar listens for `cart:received` to bloom its badge. Nothing re-renders,
 * no provider is added, and if any of it fails the item is still in the cart —
 * the motion is strictly an acknowledgement, never the mechanism.
 *
 * Costs two composited properties (transform, opacity) and one image clone. No
 * layout is touched, so the card does not shift and the flight cannot cause a
 * reflow on a page with a Lighthouse budget.
 */

const FLIGHT_RECEIVED_EVENT = "ct:cart-received";

/** Long enough for the arc to read as travel; the CSS owns the real timing. */
const FLIGHT_DURATION_MS = 520;

/**
 * The element the flight starts from — the nearest image on the card that was
 * pressed. Falls back to the button itself so a product with no photo still
 * gets an acknowledgement rather than nothing.
 */
function sourceRect(target: HTMLElement | null): { top: number; left: number; size: number } {
  const card = target?.closest("[data-flight-source]");
  const img = card?.querySelector("img");
  const el = img instanceof HTMLImageElement ? img : target;
  if (!el) return { top: 0, left: 0, size: 0 };
  const r = el.getBoundingClientRect();
  // The card's photo frame can be very wide on desktop, and the flight is a
  // travelling THUMBNAIL — it shrinks to nothing over ~520ms, so starting at
  // 500px means the first frames are a huge image rushing past the visitor.
  // Clamped, and squared so the ghost is never a letterbox.
  const size = Math.min(r.width || 64, 96);
  return { top: r.top, left: r.left, size };
}

/** The cart button in the navbar — the flight's destination. */
function cartRect(): { top: number; left: number } | null {
  const el = document.querySelector(".cart-btn");
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top + r.height / 2, left: r.left + r.width / 2 };
}

/**
 * Run the flight. Safe to call unconditionally: with no cart on the page (the
 * admin panel, a test) it simply returns, and the add still went through.
 */
export function launchCartFlight(imageUrl: string, pressed: HTMLElement | null): void {
  if (typeof window === "undefined") return;
  // Reduced motion gets no ghost at all. The cart still blooms on arrival
  // (the badge's own receive state), so the acknowledgement survives — what is
  // dropped is the travel, which is the part that provokes motion sickness.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    document.dispatchEvent(new CustomEvent(FLIGHT_RECEIVED_EVENT));
    return;
  }
  const to = cartRect();
  if (!to || !imageUrl) return;

  const ghost = document.createElement("div");
  ghost.className = "cart-flight-ghost";
  const from = sourceRect(pressed);
  // The ghost sits at the source and travels by the delta to the cart, so the
  // arc is the same shape whether the card is next to the navbar or three
  // screens down. Centre-to-centre, so the image lands ON the cart icon rather
  // than on its corner.
  const dx = to.left - (from.left + from.size / 2);
  const dy = to.top - (from.top + from.size / 2);
  // Bounded, because a card far below the fold would otherwise launch off the
  // top of the screen. `ponytail: 260px ceiling on the arc height — enough to
  // read as a lift, small enough to stay on screen; raise if the layout ever
  // puts the cart further away.`
  const lift = Math.min(Math.max(Math.abs(dy) * 0.35, 90), 260);

  ghost.style.setProperty("--flight-from-top", `${from.top}px`);
  ghost.style.setProperty("--flight-from-left", `${from.left}px`);
  ghost.style.setProperty("--flight-from-size", `${from.size}px`);
  ghost.style.setProperty("--flight-dx", `${dx}px`);
  ghost.style.setProperty("--flight-dy", `${dy}px`);
  ghost.style.setProperty("--flight-lift", `${lift}px`);
  ghost.style.backgroundImage = `url("${encodeURI(imageUrl)}")`;

  // Self-cleaning: the animation is the only reason this element exists, so
  // its end is its lifetime. A listener rather than a timer because the
  // animation can be skipped entirely under reduced motion — and then the
  // ghost must still not be left in the DOM.
  const done = () => {
    ghost.remove();
    document.dispatchEvent(new CustomEvent(FLIGHT_RECEIVED_EVENT));
  };
  ghost.addEventListener("animationend", done, { once: true });
  // Backstop for the reduced-motion and interrupted-animation cases, where
  // `animationend` may never arrive.
  setTimeout(done, FLIGHT_DURATION_MS + 120);

  document.body.appendChild(ghost);
}

/**
 * Tell the cart badge its arrival landed. The Navbar subscribes once and adds
 * a class for the length of the bloom; the CSS owns the animation itself.
 */
export function onCartReceived(handler: () => void): () => void {
  document.addEventListener(FLIGHT_RECEIVED_EVENT, handler, { once: false });
  return () => document.removeEventListener(FLIGHT_RECEIVED_EVENT, handler);
}
