"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/login/actions";

const NAV = [
  { href: "/admin", label: "Vue d'ensemble", icon: "M3 12l9-9 9 9M5 10v10h14V10" },
  { href: "/admin/artists", label: "Artistes", icon: "M16 21v-2a4 4 0 00-8 0v2M12 7a4 4 0 100 8 4 4 0 000-8z" },
  { href: "/admin/projects", label: "Projets", icon: "M12 3v10.55A4 4 0 1014 17V7h4V3z" },
  { href: "/admin/catalogue", label: "Catalogue", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/admin/links", label: "Liens de partage", icon: "M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-2 2a5 5 0 007 7l1-1" },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside
      style={{
        width: 236,
        flexShrink: 0,
        background: "var(--xol-indigo-deep)",
        color: "#e9e7f5",
        display: "flex",
        flexDirection: "column",
        padding: "22px 16px",
        position: "sticky",
        top: 0,
        height: "100vh",
      }}
    >
      <Link href="/admin" style={{ marginBottom: 28, paddingLeft: 6 }}>
        <Image
          src="/brand/xol-logo.png"
          alt="XOL Music"
          width={104}
          height={45}
          style={{
            height: "auto",
            width: 104,
            filter: "brightness(0) invert(1)",
            opacity: 0.95,
          }}
        />
      </Link>

      <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? path === "/admin"
              : path.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "9px 12px",
                borderRadius: 9,
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                background: active ? "var(--xol-indigo)" : "transparent",
                color: active ? "#fff7e6" : "#a9a5cf",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: "auto" }}>
        <form action={logoutAction}>
          <button
            type="submit"
            className="btn btn-ghost btn-sm"
            style={{ color: "#a9a5cf", width: "100%", justifyContent: "flex-start" }}
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </aside>
  );
}
