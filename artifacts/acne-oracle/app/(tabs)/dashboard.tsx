import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import Colors from "@/constants/colors";
import { useApp, type AnalysisResult } from "@/context/AppContext";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { GradientButton } from "@/components/ui/GradientButton";

const C = Colors.dark;
const { width } = Dimensions.get("window");

const SEVERITY_COLORS = [C.severity1, C.severity2, C.severity3, C.severity4, C.severity5];

function SpendingBar({ label, amount, max }: { label: string; amount: number; max: number }) {
  const pct = max > 0 ? Math.min(1, amount / max) : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct * 100}%` as any }]} />
      </View>
      <Text style={styles.barAmount}>${amount.toFixed(0)}</Text>
    </View>
  );
}

function SeverityDot({ severity, date }: { severity: number; date: string }) {
  const color = SEVERITY_COLORS[Math.max(0, severity - 1)];
  return (
    <View style={styles.dotContainer}>
      <View style={[styles.dot, { backgroundColor: color, height: (severity / 5) * 40 + 8 }]} />
      <Text style={styles.dotDate}>
        {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { analyses, products, monthlySpend, streak } = useApp();
  const [activeTab, setActiveTab] = useState<"progress" | "spend">("progress");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const last7 = analyses.slice(0, 7).reverse();
  const avgSeverity = last7.length > 0
    ? (last7.reduce((s, a) => s + a.severity, 0) / last7.length).toFixed(1)
    : "—";

  const byCategory = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.cost;
    return acc;
  }, {});
  const topCategories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const maxCat = topCategories[0]?.[1] ?? 0;

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.title}>Progress</Text>
      </View>

      <View style={styles.tabRow}>
        {(["progress", "spend"] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === "progress" ? "Skin Progress" : "Spending"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: botPad + 100, paddingTop: 4 }}
      >
        {activeTab === "progress" ? (
          <>
            <View style={styles.statsRow}>
              {[
                { label: "7-Day Avg", value: avgSeverity, icon: "analytics", color: C.accent },
                { label: "Streak", value: `${streak}d`, icon: "flame", color: "#FF8E53" },
                { label: "Total Scans", value: `${analyses.length}`, icon: "scan", color: C.teal },
              ].map((s, i) => (
                <Animated.View key={s.label} entering={FadeInDown.delay(i * 60).springify()} style={styles.miniStat}>
                  <Ionicons name={s.icon as any} size={18} color={s.color} />
                  <Text style={styles.miniStatVal}>{s.value}</Text>
                  <Text style={styles.miniStatLabel}>{s.label}</Text>
                </Animated.View>
              ))}
            </View>

            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
              <Text style={styles.sectionTitle}>Severity Trend</Text>
              {last7.length === 0 ? (
                <View style={styles.emptyChart}>
                  <Ionicons name="analytics-outline" size={36} color={C.textTertiary} />
                  <Text style={styles.emptyChartText}>No analyses yet. Scan your skin to start tracking!</Text>
                  <GradientButton label="Scan Now" onPress={() => router.push("/camera")} size="sm" style={{ marginTop: 8 }} />
                </View>
              ) : (
                <View style={styles.chartContainer}>
                  <View style={styles.chart}>
                    {last7.map((a) => (
                      <SeverityDot key={a.id} severity={a.severity} date={a.date} />
                    ))}
                  </View>
                  <View style={styles.chartLegend}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <View key={s} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: SEVERITY_COLORS[s - 1] }]} />
                        <Text style={styles.legendText}>Type {s}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.section}>
              <Text style={styles.sectionTitle}>Photo Timeline</Text>
              {analyses.length === 0 ? (
                <View style={styles.emptyPhotos}>
                  <Ionicons name="images-outline" size={36} color={C.textTertiary} />
                  <Text style={styles.emptyChartText}>Your progress photos will appear here</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.photoRow}>
                    {analyses.slice(0, 10).map((a) => (
                      <View key={a.id} style={styles.photoItem}>
                        {a.imageUri ? (
                          <Image
                            source={{ uri: a.imageUri }}
                            style={styles.photoThumb}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={[styles.photoThumb, styles.photoPlaceholder]}>
                            <Ionicons name="person-circle" size={32} color={C.textTertiary} />
                          </View>
                        )}
                        <View style={[styles.photoSeverity, { backgroundColor: SEVERITY_COLORS[Math.max(0, a.severity - 1)] + "22" }]}>
                          <Text style={[styles.photoSeverityText, { color: SEVERITY_COLORS[Math.max(0, a.severity - 1)] }]}>
                            {a.severity}
                          </Text>
                        </View>
                        <Text style={styles.photoDate}>
                          {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
              <Text style={styles.sectionTitle}>AI Recommendations</Text>
              {[
                { icon: "restaurant-outline", tip: "Reduce dairy intake — it's a top hormonal acne trigger for 60% of sufferers.", color: "#FF8E53" },
                { icon: "water-outline", tip: "Drink 2-3L water daily. Dehydration increases sebum production.", color: C.teal },
                { icon: "moon-outline", tip: "Sleep 7-9 hours. Sleep deprivation raises cortisol = breakouts.", color: C.accent },
                { icon: "fitness-outline", tip: "Wash your pillowcase every 2-3 days. It collects bacteria and oils.", color: C.severity2 },
              ].map((r, i) => (
                <View key={i} style={styles.recCard}>
                  <View style={[styles.recIcon, { backgroundColor: r.color + "22" }]}>
                    <Ionicons name={r.icon as any} size={18} color={r.color} />
                  </View>
                  <Text style={styles.recText}>{r.tip}</Text>
                </View>
              ))}
            </Animated.View>
          </>
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.section}>
              <View style={styles.totalSpendCard}>
                <LinearGradient
                  colors={["#FF6B6B15", "#FF8E5308"]}
                  style={styles.totalSpendGrad}
                >
                  <Text style={styles.totalSpendLabel}>Total Monthly Investment</Text>
                  <Text style={styles.totalSpendValue}>${monthlySpend.toFixed(2)}</Text>
                  <Text style={styles.totalSpendSub}>
                    {products.length} products · avg ${products.length > 0 ? (monthlySpend / products.length).toFixed(2) : "0"}/item
                  </Text>
                </LinearGradient>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.section}>
              <Text style={styles.sectionTitle}>By Category</Text>
              {topCategories.length === 0 ? (
                <View style={styles.emptyChart}>
                  <Ionicons name="pie-chart-outline" size={36} color={C.textTertiary} />
                  <Text style={styles.emptyChartText}>Add products to see spending breakdown</Text>
                </View>
              ) : (
                topCategories.map(([cat, amount]) => (
                  <SpendingBar key={cat} label={cat} amount={amount} max={maxCat} />
                ))
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.section}>
              <Text style={styles.sectionTitle}>Smart Swaps</Text>
              <Text style={styles.sectionSub}>Save money without sacrificing results</Text>
              {[
                { from: "Expensive retinol serum ($60+)", to: "The Ordinary Retinol 0.5% in Squalane ($7)", save: "$53+" },
                { from: "Department store moisturizer ($45+)", to: "CeraVe Moisturizing Cream ($16)", save: "$29+" },
                { from: "Branded niacinamide ($35+)", to: "The Ordinary Niacinamide 10% + Zinc ($6)", save: "$29+" },
              ].map((swap, i) => (
                <View key={i} style={styles.swapCard}>
                  <View style={styles.swapRow}>
                    <Ionicons name="close-circle" size={16} color={C.error} />
                    <Text style={styles.swapFrom}>{swap.from}</Text>
                  </View>
                  <View style={styles.swapArrow}>
                    <Ionicons name="arrow-down" size={14} color={C.textTertiary} />
                  </View>
                  <View style={styles.swapRow}>
                    <Ionicons name="checkmark-circle" size={16} color={C.success} />
                    <Text style={styles.swapTo}>{swap.to}</Text>
                  </View>
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveText}>Save {swap.save}/mo</Text>
                  </View>
                </View>
              ))}
            </Animated.View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: C.text },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: "center" },
  tabActive: { backgroundColor: C.accent },
  tabText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textSecondary },
  tabTextActive: { color: "#fff", fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginBottom: 20 },
  miniStat: {
    flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 14,
    alignItems: "center", gap: 6, borderWidth: 1, borderColor: C.cardBorder,
  },
  miniStatVal: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text },
  miniStatLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: C.textSecondary },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: C.text, marginBottom: 4 },
  sectionSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, marginBottom: 12 },
  chartContainer: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 60,
    gap: 10,
    marginBottom: 8,
  },
  dotContainer: { flex: 1, alignItems: "center", gap: 4 },
  dot: { width: 14, borderRadius: 7 },
  dotDate: { fontFamily: "Inter_400Regular", fontSize: 8, color: C.textTertiary },
  chartLegend: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: "Inter_400Regular", fontSize: 10, color: C.textSecondary },
  emptyChart: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  emptyChartText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, textAlign: "center" },
  photoRow: { flexDirection: "row", gap: 12, paddingBottom: 4 },
  photoItem: { alignItems: "center", gap: 6 },
  photoThumb: { width: 80, height: 80, borderRadius: 14 },
  photoPlaceholder: {
    backgroundColor: C.backgroundTertiary,
    justifyContent: "center", alignItems: "center",
  },
  photoSeverity: {
    width: 24, height: 24, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
    position: "absolute", top: 4, right: 4,
  },
  photoSeverityText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  photoDate: { fontFamily: "Inter_400Regular", fontSize: 10, color: C.textSecondary },
  emptyPhotos: {
    backgroundColor: C.card, borderRadius: 20, padding: 32,
    alignItems: "center", gap: 10, borderWidth: 1, borderColor: C.cardBorder,
  },
  recCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.cardBorder, marginBottom: 10,
  },
  recIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  recText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, flex: 1, lineHeight: 20 },
  totalSpendCard: {
    borderRadius: 20, overflow: "hidden",
    borderWidth: 1, borderColor: C.accent + "30",
  },
  totalSpendGrad: { padding: 24 },
  totalSpendLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.textSecondary, marginBottom: 6 },
  totalSpendValue: { fontFamily: "Inter_700Bold", fontSize: 40, color: C.text, marginBottom: 4 },
  totalSpendSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary },
  barRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  barLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textSecondary, width: 80 },
  barBg: { flex: 1, height: 8, backgroundColor: C.backgroundTertiary, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: C.accent, borderRadius: 4 },
  barAmount: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.text, width: 36, textAlign: "right" },
  swapCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.cardBorder, marginBottom: 10, gap: 6,
  },
  swapRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  swapFrom: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.error, flex: 1 },
  swapTo: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.success, flex: 1 },
  swapArrow: { paddingLeft: 24 },
  saveBadge: {
    alignSelf: "flex-start", backgroundColor: C.success + "22",
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4,
  },
  saveText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.success },
});
