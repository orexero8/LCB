import { BedSingle, BedDouble } from "lucide-react";

interface RoomTileData {
  id: string;
  roomNumber: number;
  bedLayout: string;
  pricePerNight: number;
  status: string;
  roomType: { name: string; bedLayoutLabel: string };
  currentBooking?: { guestName: string } | null;
}

const STATUS_COLORS: Record<string, { bg: string; glow: string }> = {
  AVAILABLE: { bg: "#16A34A", glow: "rgba(22,163,74,0.4)" },
  OCCUPIED: { bg: "#DC2626", glow: "rgba(220,38,38,0.4)" },
  RESERVED: { bg: "#D97706", glow: "rgba(217,119,6,0.4)" },
  BLOCKED: { bg: "#9333EA", glow: "rgba(147,51,234,0.4)" },
  MAINTENANCE: { bg: "#64748B", glow: "rgba(100,116,139,0.4)" },
};

function parseBedLayout(layout: string): { count: number; mixCount: number } {
  const clean = layout?.toLowerCase() || "";
  // "1 grand lit + lit simple" => 2 beds, first is grand (double)
  const hasPlus = clean.includes("+");
  if (hasPlus) {
    const segments = clean.split("+").map(s => s.trim());
    const grandSegments = segments.filter(s => s.includes("grand"));
    const simpleSegments = segments.filter(s => !s.includes("grand"));
    const grandCount = grandSegments.reduce((sum, s) => { const m = s.match(/(\d+)/); return sum + (m ? parseInt(m[1], 10) : 1); }, 0);
    const simpleCount = simpleSegments.reduce((sum, s) => { const m = s.match(/(\d+)/); return sum + (m ? parseInt(m[1], 10) : 1); }, 0);
    return { count: grandCount + simpleCount, mixCount: grandCount };
  }
  const count = parseInt(clean.match(/^(\d+)/)?.[1] || "1", 10);
  const isDouble = clean.includes("grand");
  return { count, mixCount: isDouble ? count : 0 };
}

function BedIcons({ layout, size = 22 }: { layout: string; size?: number }) {
  const { count, mixCount } = parseBedLayout(layout);
  if (count === 0) return null;
  // mixed: first mixCount are double beds, rest are single beds
  const icons: ("double" | "single")[] = [];
  for (let i = 0; i < mixCount; i++) icons.push("double");
  for (let i = mixCount; i < count; i++) icons.push("single");
  if (icons.length === 1) {
    const Icon = icons[0] === "double" ? BedDouble : BedSingle;
    return <Icon size={size} color="rgba(255,255,255,0.9)" strokeWidth={1.8} />;
  }
  return (
    <div style={{ display: "flex", gap: count > 2 ? 2 : 3, alignItems: "center", justifyContent: "center" }}>
      {icons.map((type, i) => {
        const Icon = type === "double" ? BedDouble : BedSingle;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.15)", borderRadius: 3, padding: "1px 1px" }}>
            <Icon size={count > 2 ? size - 2 : size} color="rgba(255,255,255,0.9)" strokeWidth={1.8} />
          </div>
        );
      })}
    </div>
  );
}

export function RoomTile({
  room,
  onClick,
}: {
  room: RoomTileData;
  onClick: () => void;
}) {
  const c = STATUS_COLORS[room.status] || STATUS_COLORS.MAINTENANCE;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center rounded-2xl border-none cursor-pointer transition-all duration-150 hover:scale-[1.06] active:scale-[1.02]"
      style={{
        width: 128,
        height: 128,
        background: `linear-gradient(145deg, ${c.bg}, ${c.bg}dd)`,
        boxShadow: `0 4px 14px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
        gap: 3,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle inner highlight */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "40%",
        background: "linear-gradient(180deg, rgba(255,255,255,0.13) 0%, transparent 100%)",
        borderRadius: "14px 14px 0 0",
        pointerEvents: "none",
      }} />
      <BedIcons layout={room.bedLayout} size={20} />
      <span style={{ fontSize: 28, fontWeight: 900, color: "white", lineHeight: 1.1, letterSpacing: 1.5, textShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
        {room.roomNumber.toString().padStart(2, "0")}
      </span>
      <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.85)", lineHeight: 1 }}>
        {room.pricePerNight.toLocaleString()} DA
      </span>
      {room.currentBooking && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)",
          padding: "3px 4px",
        }}>
          <span style={{
            fontSize: 9, color: "rgba(255,255,255,0.9)", fontWeight: 600,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", textAlign: "center",
          }}>
            {room.currentBooking.guestName}
          </span>
        </div>
      )}
    </button>
  );
}
