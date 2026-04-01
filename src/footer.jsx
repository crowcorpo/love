import React from "react";


const footerLinks = {
  Company: ["About Us", "Careers", "Press", "Blog"],
  Product: ["Features", "Pricing", "Changelog", "Roadmap"],
  Resources: ["Documentation", "Tutorials", "Community", "Support"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"],
};

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/corpo.crow/" },
  { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61587735964392" },
  { label: "Tiktok", href: "https://www.tiktok.com/@corpo.crow?is_from_webapp=1&sender_device=pc" },
  { label: "Fiver", href: "https://www.fiverr.com/s/XLyzldk" },
];

function Footer() {
  return (
    <footer id="footer" className="footer">
      <div className="footer__inner">

        {/* Brand */}
        <div className="footer__brand">
          <div className="footer__logo">
            <span className="footer__logo-mark">✦ </span>
            <span className="footer__logo-name">Corpo</span>
          </div>
          <p className="footer__tagline">
            Building tools that inspire creators and empower teams worldwide.
          </p>
          <div className="footer__socials">
            {socialLinks.map(({ label, href }) => (
              <a key={label} href={href} className="footer__social-link" aria-label={label}>
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Link Columns */}
        <nav className="footer__nav">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="footer__nav-column">
              <h4 className="footer__nav-heading">{category}</h4>
              <ul className="footer__nav-list">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="footer__nav-link">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

      </div>

      {/* Bottom bar */}
      <div className="footer__bottom">
        <p className="footer__copy">© {new Date().getFullYear()} Luminary, Inc. All rights reserved.</p>
        <p className="footer__made">Crafted with care ✦</p>
      </div>
    </footer>
  );
}

export default Footer;