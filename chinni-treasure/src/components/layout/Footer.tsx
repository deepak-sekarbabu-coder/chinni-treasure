import Link from "next/link";
import FooterClientWrapper from "@/src/components/layout/FooterClientWrapper";

type ContactIconProps = {
  type: "phone" | "whatsapp" | "mail" | "instagram" | "facebook";
};

function ContactIcon({ type }: ContactIconProps) {
  switch (type) {
    case "phone":
      return (
        <svg className="contact-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M6.6 2.8 4.2 4.1c-.7.4-1 1.2-.8 1.9 1.1 4.5 4.6 8 9.1 9.1.8.2 1.6-.1 1.9-.8l1.3-2.4c.3-.6.1-1.3-.5-1.7l-2.4-1.4c-.5-.3-1.2-.2-1.6.2l-.9.9c-1.5-.8-2.7-2-3.5-3.5l.9-.9c.4-.4.5-1.1.2-1.6L6.6 3c-.3-.6-1.1-.8-1.7-.5Z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg className="contact-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M8.5 15.5a7 7 0 1 0-5.9-3.3L2 16l3.9-1a7 7 0 0 0 2.6.5Z" />
          <path d="M6.4 5.8c-.2-.4-.3-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.8 4.5 3.8 2.2.9 2.7.7 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-1.8-.9c-.3-.1-.5-.2-.7.1l-.7.9c-.1.2-.3.2-.6.1-.3-.1-1.1-.4-2.1-1.3-.8-.7-1.3-1.6-1.5-1.9-.2-.3 0-.4.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.8-1.9Z" />
        </svg>
      );
    case "mail":
      return (
        <svg className="contact-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 5.5h14v9H3z" />
          <path d="m3 6 7 5 7-5" />
        </svg>
      );
    case "instagram":
      return (
        <svg className="contact-icon" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="3" y="3" width="14" height="14" rx="4" />
          <circle cx="10" cy="10" r="3" />
          <circle cx="14" cy="6" r=".7" />
        </svg>
      );
    case "facebook":
      return (
        <svg className="contact-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M11 17v-6h2l.4-2.6H11V6.9c0-.8.3-1.3 1.4-1.3h1.2V3.2C13 3.1 12.3 3 11.5 3 9.5 3 8.2 4.2 8.2 6.6v1.8H6V11h2.2v6H11Z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-grid">
        <div className="footer-brand">
          <div style={{ textAlign: "center" }}>
            <h3>Chinni Treasure</h3>
            <div className="little-love-text">
              <span className="brand-heart">❤</span> <span className="brand-tagline">Little Love</span> <span className="brand-heart">❤</span>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <p>Curating the finest artisan-crafted luxury goods for discerning customers worldwide.</p>
          </div>
        </div>
        <div>
          <h4>Quick Links</h4>
          <ul role="list">
            <li role="listitem"><Link href="/catalogue">Catalogue</Link></li>
            <li role="listitem"><Link href="/order">Place Order</Link></li>
            <li role="listitem"><Link href="/track">Track Order</Link></li>
          </ul>
        </div>
        <div>
          <h4>Customer Care</h4>
          <ul role="list">
            <li role="listitem"><FooterClientWrapper /></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul className="contact-list" role="list">
            <li role="listitem">
              <a href="tel:+919499011029" aria-label="Call Chinni Treasure at +91 9499011029">
                <ContactIcon type="phone" />
                <span>+91 9499011029</span>
              </a>
            </li>
            <li role="listitem">
              <a href="https://wa.me/919499011029" target="_blank" rel="noopener noreferrer" aria-label="Message Chinni Treasure on WhatsApp at +91 9499011029">
                <ContactIcon type="whatsapp" />
                <span>+91 9499011029</span>
              </a>
            </li>
            <li role="listitem">
              <a href="mailto:chinnitreasures29@gmail.com" aria-label="Email Chinni Treasure at chinnitreasure29@gmail.com">
                <ContactIcon type="mail" />
                <span>chinnitreasure29@gmail.com</span>
              </a>
            </li>
            <li role="listitem">
              <a href="https://www.instagram.com/ChinniTreasure" target="_blank" rel="noopener noreferrer" aria-label="Open Chinni Treasure on Instagram — ChinniTreasure">
                <ContactIcon type="instagram" />
                <span>ChinniTreasure</span>
              </a>
            </li>
            <li role="listitem">
              <a href="https://www.facebook.com/ChinniTreasures" target="_blank" rel="noopener noreferrer" aria-label="Open Chinni Treasure on Facebook — ChinniTreasures">
                <ContactIcon type="facebook" />
                <span>ChinniTreasures</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} Chinni Treasure &mdash; <span className="brand-heart">❤</span> <span className="brand-tagline">Little Love</span> <span className="brand-heart">❤</span> All rights reserved.</span>
        <span>Made with care</span>
      </div>
    </footer>
  );
}
