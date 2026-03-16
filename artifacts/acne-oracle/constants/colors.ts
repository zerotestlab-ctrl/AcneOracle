const accent = "#FF6B6B";
const accentAlt = "#FF8E53";
const teal = "#00C9A7";
const tealDark = "#00A896";

export default {
  dark: {
    background: "#080B10",
    backgroundSecondary: "#0F1319",
    backgroundTertiary: "#171C25",
    card: "#131820",
    cardBorder: "#1E2535",
    text: "#FFFFFF",
    textSecondary: "#8C94A6",
    textTertiary: "#4A5568",
    accent,
    accentAlt,
    accentGradient: [accent, accentAlt] as [string, string],
    teal,
    tealDark,
    tealGradient: [teal, tealDark] as [string, string],
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    tabBar: "rgba(8,11,16,0.92)",
    tabActive: accent,
    tabInactive: "#4A5568",
    separator: "#1E2535",
    overlay: "rgba(0,0,0,0.85)",
    inputBg: "#0F1319",
    inputBorder: "#1E2535",
    inputBorderFocus: accent,
    severity1: "#22C55E",
    severity2: "#84CC16",
    severity3: "#F59E0B",
    severity4: "#EF4444",
    severity5: "#7C3AED",
    scoreGlow: "rgba(255,107,107,0.3)",
  },
};
