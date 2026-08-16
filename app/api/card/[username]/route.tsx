import { ImageResponse } from "@vercel/og";
import { getCard } from "@/lib/getCard";

export const dynamic = "force-dynamic";

const COLORS = {
  pitch: "#0E1420",
  chalk: "#F4F1E8",
  bail: "#D9A93B",
  leather: "#C1443B",
  dusk: "#2B3D6B",
  ink: "#1B1B18",
};

const TIER_THEME: Record<string, { bg: string; ribbon: string; ribbonText: string; border: string; bar: string }> = {
  Bronze: { bg: "linear-gradient(180deg, #8a5a3c 0%, #4f321f 100%)", ribbon: "#c98a56", ribbonText: COLORS.ink, border: "#c98a56", bar: "#c98a56" },
  Silver: { bg: "linear-gradient(180deg, #d4d8dc 0%, #868c92 100%)", ribbon: "#eef0f2", ribbonText: COLORS.ink, border: "#eef0f2", bar: "#c3c8cd" },
  Gold: { bg: "linear-gradient(180deg, #f3d488 0%, #a97a2c 100%)", ribbon: COLORS.bail, ribbonText: COLORS.ink, border: COLORS.bail, bar: COLORS.bail },
  Legend: { bg: "linear-gradient(120deg, #1b1b18 0%, #6e2620 25%, #D9A93B 50%, #f4e6b8 65%, #2B3D6B 85%, #1b1b18 100%)", ribbon: "linear-gradient(90deg, #C1443B, #D9A93B, #2B3D6B)", ribbonText: COLORS.chalk, border: "#EBD79A", bar: "#D9A93B" },
};

export async function GET(req: Request, { params }: { params: { username: string } }) {
  const card = await getCard(params.username);

  if (!card) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: COLORS.pitch,
            color: COLORS.chalk,
            fontSize: 28,
          }}
        >
          Player not found
        </div>
      ),
      { width: 600, height: 200 }
    );
  }

  const theme = TIER_THEME[card.tier];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: theme.bg,
          padding: 3,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            backgroundColor: COLORS.chalk,
            borderRadius: 12,
            fontFamily: "sans-serif",
            padding: "16px 26px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ color: COLORS.ink, fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{card.rating}</div>
              <div style={{ color: "rgba(27,27,24,0.5)", fontSize: 11, letterSpacing: 2, marginTop: 4 }}>
                RATING · {card.tier.toUpperCase()}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginRight: 16 }}>
                <div style={{ color: COLORS.dusk, fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>
                  {card.role.toUpperCase()}
                </div>
                <div style={{ color: COLORS.ink, fontSize: 20, fontWeight: 700, marginTop: 2 }}>{card.name}</div>
                <div style={{ color: "rgba(27,27,24,0.5)", fontSize: 13 }}>@{card.login}</div>
              </div>
              <img
                src={card.avatarUrl}
                width={64}
                height={64}
                style={{ borderRadius: "50%", border: `3px solid ${theme.border}` }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 12,
              padding: "6px 0",
              borderRadius: 6,
              background: theme.ribbon,
            }}
          >
            <div style={{ color: theme.ribbonText, fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
              ★ {card.signatureStat.toUpperCase()}
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 14 }}>
            {card.cardStats.map((s) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", width: "50%", padding: "6px 8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ color: "rgba(27,27,24,0.6)", fontSize: 12, letterSpacing: 1 }}>{s.label}</div>
                  <div style={{ color: COLORS.ink, fontSize: 15, fontWeight: 700 }}>{s.value}</div>
                </div>
                <div style={{ display: "flex", width: "100%", height: 6, borderRadius: 3, backgroundColor: "rgba(27,27,24,0.1)", marginTop: 4 }}>
                  <div style={{ display: "flex", width: `${s.value}%`, height: "100%", borderRadius: 3, backgroundColor: theme.bar }} />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 10,
              color: "rgba(27,27,24,0.35)",
              fontSize: 11,
              letterSpacing: 2,
            }}
          >
            GITWICKET.DEV · {card.accountAgeYears}YR CAREER
          </div>
        </div>
      </div>
    ),
    { width: 600, height: 340 }
  );
}
