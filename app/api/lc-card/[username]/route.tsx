import { ImageResponse } from "@vercel/og";
import { getLeetCodeCard } from "@/lib/getLeetCodeCard";

export const dynamic = "force-dynamic";

const COLORS = {
  pitch: "#0E1420",
  chalk: "#F4F1E8",
  amber: "#E2852B",
  ink: "#1B1B18",
};

const TIER_THEME: Record<string, { bg: string; ribbon: string; ribbonText: string; border: string; bar: string }> = {
  Bronze: { bg: "linear-gradient(180deg, #8a8677 0%, #4a493f 100%)", ribbon: "#8a8677", ribbonText: COLORS.chalk, border: "#8a8677", bar: "#8a8677" },
  Silver: { bg: "linear-gradient(180deg, #d6dee2 0%, #7a8a95 100%)", ribbon: "#e4ecf0", ribbonText: COLORS.ink, border: "#e4ecf0", bar: "#aebcc4" },
  Gold: { bg: "linear-gradient(180deg, #ffce93 0%, #b8631d 100%)", ribbon: COLORS.amber, ribbonText: COLORS.chalk, border: COLORS.amber, bar: COLORS.amber },
  Legend: { bg: "linear-gradient(120deg, #1b1b18 0%, #6C3FA6 30%, #E2852B 55%, #ffe9c9 70%, #1b1b18 100%)", ribbon: "linear-gradient(90deg, #E2852B, #6C3FA6, #1b1b18)", ribbonText: COLORS.chalk, border: "#f0a94a", bar: "#E2852B" },
};

export async function GET(req: Request, { params }: { params: { username: string } }) {
  const card = await getLeetCodeCard(params.username);

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
                RATING · {card.tier.toUpperCase()} · LEETCODE
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", marginRight: 16 }}>
                <div style={{ color: COLORS.amber, fontSize: 15, fontWeight: 700, letterSpacing: 1 }}>
                  {card.role.toUpperCase()}
                </div>
                <div style={{ color: COLORS.ink, fontSize: 20, fontWeight: 700, marginTop: 2 }}>{card.name}</div>
                <div style={{ color: "rgba(27,27,24,0.5)", fontSize: 13 }}>@{card.login}</div>
              </div>
              {card.avatarUrl ? (
                <img
                  src={card.avatarUrl}
                  width={64}
                  height={64}
                  style={{ borderRadius: "50%", border: `3px solid ${theme.border}` }}
                />
              ) : null}
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
