// Pochette d'un titre ou projet. Si aucun visuel n'est fourni, on affiche
// le logo XOL carre par defaut (au lieu d'un carre gris vide).
export default function Cover({
  src,
  size,
  radius = 12,
}: {
  src?: string | null;
  size: number | string;
  radius?: number;
}) {
  const box: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
    overflow: "hidden",
    background: "#fff",
    border: "1px solid var(--border)",
  };

  if (src) {
    return (
      <div style={box}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }

  // Repli : logo XOL centre sur fond blanc.
  return (
    <div style={{ ...box, display: "grid", placeItems: "center", padding: "14%" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/xol-square.jpg"
        alt="XOL Music"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}
