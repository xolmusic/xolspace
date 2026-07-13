"use client";

import { GENRES } from "@/lib/genres";

export default function GenreSelect({
  name = "genre",
  defaultValue,
  id,
}: {
  name?: string;
  defaultValue?: string | null;
  id?: string;
}) {
  return (
    <select id={id} name={name} className="select" defaultValue={defaultValue ?? ""}>
      <option value="">— Aucun genre —</option>
      {GENRES.map((g) => (
        <option key={g} value={g}>
          {g}
        </option>
      ))}
    </select>
  );
}
