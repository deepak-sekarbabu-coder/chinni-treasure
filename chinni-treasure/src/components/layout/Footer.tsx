import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-grid">
        <div className="footer-brand">
          <h3>Chinni Treasure</h3>
          <p>Curating the finest artisan-crafted luxury goods for discerning customers worldwide.</p>
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
            <li role="listitem"><a href="#">Shipping Info</a></li>
            <li role="listitem"><a href="#">Returns Policy</a></li>
            <li role="listitem"><a href="#">Contact Us</a></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul role="list">
            <li role="listitem"><a href="mailto:chinnitreasure@gmail.com">chinnitreasure@gmail.com</a></li>
            <li role="listitem"><a href="tel:+919876543210">+91 9876543210</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} Chinni Treasure &mdash; Little Love All rights reserved.</span>
        <span>Made with care</span>
      </div>
    </footer>
  );
}
