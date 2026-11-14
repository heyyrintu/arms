"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import wordmark from "@/public/brand/arms-wordmark.webp";

const links = [
  { href: "/solutions", label: "Solutions" },
  { href: "/industries", label: "Industries" },
  { href: "/jobs", label: "Find Jobs" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/talent-network", label: "Join Talent Network" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);

  return (
    <header className="site-header" onKeyDown={event => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    }}>
      <div className="container header-inner">
        <Link href="/" aria-label="ARMS Talent Partners home" onClick={() => setOpen(false)} className="logo-link">
          <Image src={wordmark} alt="" sizes="(max-width: 650px) 140px, 160px" preload className="wordmark" />
        </Link>
        <button ref={toggle} type="button" className="menu-toggle" aria-expanded={open} aria-controls="primary-links" onClick={() => setOpen(!open)}>
          {open ? "Close menu" : "Menu"} <span aria-hidden="true">{open ? "✕" : "☰"}</span>
        </button>
        <nav aria-label="Primary navigation" className={`nav ${open ? "nav-open" : ""}`}>
          <div className="nav-links" id="primary-links">
            {links.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={pathname === link.href ? "page" : pathname.startsWith(link.href + "/") ? "location" : undefined}>
                {link.label}
              </Link>
            ))}
          </div>
          <div className="nav-actions">
            <Link href="/hire-workforce" className="nav-action" onClick={() => setOpen(false)}>Hire Workforce <span aria-hidden="true">↗</span></Link>
            <Link href="/jobs" className="nav-action" onClick={() => setOpen(false)}>Find Work <span aria-hidden="true">↗</span></Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
