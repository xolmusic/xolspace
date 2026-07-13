// Pochette d'un titre ou projet. Si aucun visuel n'est fourni, on affiche
// le logo XOL carre par defaut sur fond blanc.
export default function Cover({
  src,
  size,
  radius = 12,
}: {
  src?: string | null;
  size: number | string;
  radius?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        overflow: "hidden",
        background: "#ffffff",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src || "/brand/xol-square.jpg"}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: src ? "cover" : "contain",
          padding: src ? 0 : "12%",
        }}
      />
    </div>
  );
}
