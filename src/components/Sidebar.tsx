"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/app/login/actions";

const NAV = [
  { href: "/admin", label: "Vue d'ensemble", icon: "M3 12l9-9 9 9M5 10v10h14V10" },
  { href: "/admin/artists", label: "Artistes", icon: "M16 21v-2a4 4 0 00-8 0v2M12 7a4 4 0 100 8 4 4 0 000-8z" },
  { href: "/admin/projects", label: "Projets", icon: "M12 3v10.55A4 4 0 1014 17V7h4V3z" },
  { href: "/admin/catalogue", label: "Catalogue", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/admin/epk", label: "Presskit EPK", icon: "M4 5h16v14H4zM4 9h16M9 5v14" },
  { href: "/admin/crm", label: "CRM", icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8z" },
  { href: "/admin/campaigns", label: "Campagnes", icon: "M3 11l18-5v12L3 14v-3zM11.6 16.8a3 3 0 11-5.8-1.6" },
  { href: "/admin/finances", label: "Finances", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { href: "/admin/links", label: "Liens de partage", icon: "M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l1-1" },
];

// Reserve aux super admins.
const SUPER_NAV = [
  { href: "/admin/users", label: "Utilisateurs", icon: "M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
];

export default function Sidebar({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const items = isSuperAdmin ? [...NAV, ...SUPER_NAV] : NAV;

  const nav = (
    <nav className="xol-nav">
      {items.map((item) => {
        const active =
          item.href === "/admin" ? path === "/admin" : path.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`xol-nav-item${active ? " active" : ""}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const logo = (
    <Image
      src="/brand/xol-logo.png"
      alt="XOL Music"
      width={104}
      height={45}
      style={{ height: "auto", width: 104, filter: "brightness(0) invert(1)", opacity: 0.95 }}
    />
  );

  const logout = (
    <form action={logoutAction}>
      <button type="submit" className="btn btn-ghost btn-sm xol-logout">
        Se déconnecter
      </button>
    </form>
  );

  return (
    <>
      {/* Barre superieure mobile */}
      <div className="xol-topbar">
        <Link href="/admin" onClick={() => setOpen(false)}>{logo}</Link>
        <button
          className="xol-burger"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Overlay + panneau mobile */}
      {open && <div className="xol-overlay" onClick={() => setOpen(false)} />}
      <aside className={`xol-sidebar${open ? " open" : ""}`}>
        <Link href="/admin" onClick={() => setOpen(false)} className="xol-sidebar-logo">
          {logo}
        </Link>
        {nav}
        <div style={{ marginTop: "auto" }}>{logout}</div>
      </aside>
    </>
  );
}
