import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Colors from "@/constants/colors";

const C = Colors.dark;

const SEVERITY_LABELS = ["Clear", "Mild", "Moderate", "Severe", "Very Severe"];
const SEVERITY_COLORS = [
  C.severity1,
  C.severity2,
  C.severity3,
  C.severity4,
  C.severity5,
];

const ACNE_TYPE_LABELS: Record<string, string> = {
  comedonal: "Comedonal",
  inflammatory: "Inflammatory",
  cystic: "Cystic",
  hormonal: "Hormonal",
  mixed: "Mixed",
  unknown: "Unknown",
};

interface SeverityBadgeProps {
  severity: number;
  acneType?: string;
}

export function SeverityBadge({ severity, acneType }: SeverityBadgeProps) {
  const idx = Math.max(0, Math.min(4, severity - 1));
  const color = SEVERITY_COLORS[idx];
  const label = SEVERITY_LABELS[idx];

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: color + "22", borderColor: color + "55" }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.label, { color }]}>
          Type {severity} · {label}
        </Text>
      </View>
      {acneType && acneType !== "unknown" && (
        <View style={styles.typeBadge}>
          <Text style={styles.typeLabel}>{ACNE_TYPE_LABELS[acneType] ?? acneType} Acne</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  typeLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: C.textSecondary,
  },
});
