"use client";

import AudioPlayer from "@/components/AudioPlayer";

type Item = {
  id: string;
  title: string;
  subtitle?: string;
};

export default function PublicPlayer({
  token,
  items,
  password,
}: {
  token: string;
  items: Item[];
  password?: string;
}) {
  const qs = password ? `?pw=${encodeURIComponent(password)}` : "";

  return (
    <div className="stack" style={{ gap: 12 }}>
      {items.map((it) => (
        <AudioPlayer
          key={it.id}
          src={`/api/s/${token}/stream/${it.id}${qs}`}
          title={it.title}
          subtitle={it.subtitle}
        />
      ))}
    </div>
  );
}
