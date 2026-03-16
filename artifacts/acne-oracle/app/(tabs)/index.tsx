import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
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
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";

import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { GradientButton } from "@/components/ui/GradientButton";

const C = Colors.dark;
const { width } = Dimensions.get("window");

const ACNE_TYPE_NAMES: Record<string, string> = {
  comedonal: "Comedonal",
  inflammatory: "Inflammatory",
  cystic: "Cystic",
  hormonal: "Hormonal",
  mixed: "Mixed",
  unknown: "Unknown",
};

const DISCLAIMER = "AcneOracle is a wellness coach, not a medical doctor. Always consult a dermatologist for medical concerns.";

function StatCard({ icon, label, value, color, delay }: {
  icon: string;
  label: string;
  value: string;
  color: string;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={styles.statCard}>
      <View style={[styles.statIconBg, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { analyses, monthlySpend, streak, latestAnalysis, isPremium } = useApp();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/camera");
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: topPad + 12, paddingBottom: botPad + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.title}>AcneOracle</Text>
          </View>
          <Pressable
            onPress={() => router.push("/paywall")}
            style={styles.premiumBadge}
          >
            {isPremium ? (
              <LinearGradient
                colors={C.accentGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.premiumGradient}
              >
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={styles.premiumText}>Pro</Text>
              </LinearGradient>
            ) : (
              <View style={styles.freeBadge}>
                <Ionicons name="star-outline" size={12} color={C.accent} />
                <Text style={styles.freeText}>Upgrade</Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.scanCard}>
          <LinearGradient
            colors={["#FF6B6B18", "#FF8E5308"]}
            style={styles.scanGradient}
          >
            <View style={styles.scanContent}>
              <View style={styles.scanLeft}>
                <Text style={styles.scanTitle}>Daily Skin Scan</Text>
                <Text style={styles.scanSub}>Get your AI-powered acne analysis</Text>
                <GradientButton
                  label="Scan Now"
                  onPress={handleScan}
                  style={{ marginTop: 16, alignSelf: "flex-start" }}
                  size="md"
                />
              </View>
              <View style={styles.scanIcon}>
                <LinearGradient
                  colors={C.accentGradient}
                  style={styles.scanIconBg}
                >
                  <Ionicons name="scan" size={32} color="#fff" />
                </LinearGradient>
              </View>
            </View>
            <View style={styles.disclaimer}>
              <Ionicons name="information-circle-outline" size={12} color={C.textTertiary} />
              <Text style={styles.disclaimerText}>{DISCLAIMER}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.statsRow}>
          <StatCard icon="flame" label="Day Streak" value={`${streak}`} color="#FF6B6B" delay={120} />
          <StatCard icon="scan" label="Scans" value={`${analyses.length}`} color="#00C9A7" delay={150} />
          <StatCard icon="wallet" label="Monthly" value={`$${monthlySpend.toFixed(0)}`} color="#FF8E53" delay={180} />
        </View>

        {latestAnalysis && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Latest Analysis</Text>
              <Pressable onPress={() => router.push("/results")}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.latestCard}
              onPress={() => router.push("/results")}
            >
              <View style={styles.latestRow}>
                {latestAnalysis.imageUri ? (
                  <Image
                    source={{ uri: latestAnalysis.imageUri }}
                    style={styles.latestImg}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.latestImg, styles.latestImgPlaceholder]}>
                    <Ionicons name="person-circle" size={40} color={C.textTertiary} />
                  </View>
                )}
                <View style={styles.latestInfo}>
                  <Text style={styles.latestDate}>
                    {new Date(latestAnalysis.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Text>
                  <SeverityBadge
                    severity={latestAnalysis.severity}
                    acneType={latestAnalysis.acneType}
                  />
                  <Text style={styles.latestDesc} numberOfLines={2}>
                    {latestAnalysis.description}
                  </Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {[
              { icon: "chatbubble-ellipses", label: "AI Coach", sub: "Ask anything", route: "/community", color: C.teal },
              { icon: "pulse", label: "Progress", sub: "View trends", route: "/(tabs)/dashboard", color: "#FF8E53" },
              { icon: "bag-add", label: "Add Product", sub: "Track spending", route: "/(tabs)/log", color: C.accent },
            ].map((item, i) => (
              <Animated.View key={item.label} entering={FadeInRight.delay(260 + i * 40).springify()}>
                <Pressable
                  style={({ pressed }) => [styles.quickCard, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push(item.route as any);
                  }}
                >
                  <View style={[styles.quickIcon, { backgroundColor: item.color + "22" }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <Text style={styles.quickLabel}>{item.label}</Text>
                  <Text style={styles.quickSub}>{item.sub}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Skin Tips Today</Text>
          {[
            { tip: "Dairy can trigger hormonal acne. Try dairy-free alternatives for 30 days.", icon: "nutrition", color: C.teal },
            { tip: "Niacinamide 10% + Zinc reduces sebum and pores. The Ordinary's version is just $6.", icon: "flask", color: C.accent },
            { tip: "Never skip SPF — UV radiation worsens post-acne dark spots.", icon: "sunny", color: "#FF8E53" },
          ].map((t, i) => (
            <View key={i} style={styles.tipCard}>
              <View style={[styles.tipIcon, { backgroundColor: t.color + "22" }]}>
                <Ionicons name={t.icon as any} size={18} color={t.color} />
              </View>
              <Text style={styles.tipText}>{t.tip}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, marginBottom: 2 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: C.text },
  premiumBadge: { marginTop: 4 },
  premiumGradient: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  premiumText: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#fff" },
  freeBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
    backgroundColor: C.accent + "18", borderWidth: 1, borderColor: C.accent + "44",
  },
  freeText: { fontFamily: "Inter_600SemiBold", fontSize: 11, color: C.accent },
  scanCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.accent + "30",
    marginBottom: 20,
  },
  scanGradient: { padding: 20 },
  scanContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scanLeft: { flex: 1 },
  scanTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text, marginBottom: 4 },
  scanSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary },
  scanIcon: { marginLeft: 12 },
  scanIconBg: {
    width: 68, height: 68, borderRadius: 20,
    justifyContent: "center", alignItems: "center",
  },
  disclaimer: { flexDirection: "row", gap: 6, alignItems: "flex-start", marginTop: 16, opacity: 0.7 },
  disclaimerText: { fontFamily: "Inter_400Regular", fontSize: 10, color: C.textTertiary, flex: 1 },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 6,
  },
  statIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textSecondary },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: C.text },
  seeAll: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.accent },
  latestCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  latestRow: { flexDirection: "row", gap: 14 },
  latestImg: { width: 80, height: 80, borderRadius: 14 },
  latestImgPlaceholder: {
    backgroundColor: C.backgroundTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  latestInfo: { flex: 1, gap: 6 },
  latestDate: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary },
  latestDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, lineHeight: 18 },
  quickActions: { flexDirection: "row", gap: 10 },
  quickCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 8,
  },
  quickIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  quickLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: C.text },
  quickSub: { fontFamily: "Inter_400Regular", fontSize: 10, color: C.textSecondary },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 10,
  },
  tipIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  tipText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, flex: 1, lineHeight: 20 },
});
