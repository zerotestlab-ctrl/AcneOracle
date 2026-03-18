const accent = "#FF6B6B";
const accentAlt = "#FF8E53";
const teal = "#00C9A7";
const tealDark = "#00A896";

export default {
  dark: {
    background: "#0D0A10",
    backgroundSecondary: "#140F18",
    backgroundTertiary: "#1C1522",
    card: "#19101C",
    cardBorder: "#281C30",
    text: "#F5F0FF",
    textSecondary: "#9B8FAE",
    textTertiary: "#5A4E68",
    accent,
    accentAlt,
    accentGradient: [accent, accentAlt] as [string, string],
    teal,
    tealDark,
    tealGradient: [teal, tealDark] as [string, string],
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    tabBar: "rgba(13,10,16,0.94)",
    tabActive: accent,
    tabInactive: "#5A4E68",
    separator: "#221828",
    overlay: "rgba(0,0,0,0.85)",
    inputBg: "#140F18",
    inputBorder: "#281C30",
    inputBorderFocus: accent,
    severity1: "#22C55E",
    severity2: "#84CC16",
    severity3: "#F59E0B",
    severity4: "#EF4444",
    severity5: "#7C3AED",
    scoreGlow: "rgba(255,107,107,0.3)",
  },
};
