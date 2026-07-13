"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Option = { value: string; label: string };

// Menu deroulant de filtre : au changement, met a jour le parametre d'URL
// indique (en conservant les autres) et recharge la page.
export default function FilterSelect({
  param,
  value,
  allLabel,
  options,
  width,
}: {
  param: string;
  value?: string;
  allLabel: string;
  options: Option[];
  width?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(v: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (v) p.set(param, v);
    else p.delete(param);
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <select
      className="select"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      style={{ height: 34, width: width ?? "auto", minWidth: 150 }}
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
