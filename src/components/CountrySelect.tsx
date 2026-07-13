"use client";

import { COUNTRIES } from "@/lib/countries";

export default function CountrySelect({
  name = "country",
  defaultValue,
  id,
  includeEmpty = true,
}: {
  name?: string;
  defaultValue?: string | null;
  id?: string;
  includeEmpty?: boolean;
}) {
  return (
    <select id={id} name={name} className="select" defaultValue={defaultValue ?? ""}>
      {includeEmpty && <option value="">— Pays —</option>}
      {COUNTRIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
