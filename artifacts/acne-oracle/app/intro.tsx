import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { GradientButton } from "@/components/ui/GradientButton";
import { useApp } from "@/context/AppContext";

const C = Colors.dark;
const { width } = Dimensions.get("window");

const FEATURES = [
  { icon: "scan-outline", text: "Analyses your real photos with AI", color: C.accent },
  { icon: "wallet-outline", text: "Tracks exactly what you spend on skincare", color: "#FF8E53" },
  { icon: "nutrition-outline", text: "Honest advice on routines, food, and triggers", color: C.teal },
  { icon: "people-outline", text: "You are not alone in this journey", color: "#A78BFA" },
];

function PulsingOrb() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 2000 }), withTiming(1, { duration: 2000 })),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0.9, { duration: 2000 }), withTiming(0.6, { duration: 2000 })),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.orbOuter, style]}>
      <LinearGradient colors={["#FF6B6B20", "#00C9A712"]} style={styles.orbInner} />
    </Animated.View>
  );
}

export default function IntroScreen() {
  const insets = useSafeAreaInsets();
  const { markIntroSeen } = useApp();
  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const botPad = Platform.OS === "web" ? 32 : insets.bottom;

  const handleStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await markIntroSeen();
    router.replace("/onboarding");
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <LinearGradient
        colors={["#FF6B6B0A", "#00C9A706", C.background]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <PulsingOrb />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 24, paddingBottom: botPad + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={ZoomIn.delay(100).springify()} style={styles.logoWrap}>
          <LinearGradient colors={C.accentGradient} style={styles.logoGrad}>
            <Ionicons name="sparkles" size={40} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.titleWrap}>
          <Text style={styles.appName}>AcneOracle</Text>
          <View style={styles.taglineRow}>
            <View style={styles.taglineDot} />
            <Text style={styles.tagline}>Your personal AI skin coach</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.heroCard}>
          <Text style={styles.heroText}>
            Welcome to AcneOracle – your personal AI skin coach that actually gets it.
          </Text>
          <Text style={styles.heroBody}>
            I analyse your real photos, track exactly what you spend, understand your full journey, and give honest, caring advice on routines, food, and smarter choices so you finally clear your skin and stop wasting money.
          </Text>
          <Text style={styles.heroEmphasis}>You're not alone anymore.</Text>
        </Animated.View>

        <View style={styles.featureList}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.text}
              entering={FadeInDown.delay(500 + i * 80).springify()}
              style={styles.featureRow}
            >
              <View style={[styles.featureIcon, { backgroundColor: f.color + "20" }]}>
                <Ionicons name={f.icon as any} size={20} color={f.color} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeIn.delay(900).springify()} style={styles.disclaimer}>
          <Ionicons name="shield-checkmark-outline" size={13} color={C.textTertiary} />
          <Text style={styles.disclaimerText}>
            AI wellness coach only — not a doctor. Always consult a dermatologist for medical decisions.
          </Text>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(700).springify()}
        style={[styles.footer, { paddingBottom: botPad + 16 }]}
      >
        <GradientButton
          label="Get Started"
          onPress={handleStart}
          size="lg"
          style={{ borderRadius: 20 }}
        />
        <Text style={styles.footerSub}>Free to start · No credit card required</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  orbOuter: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  orbInner: {
    flex: 1,
    borderRadius: 130,
  },
  logoWrap: {
    alignSelf: "center",
    marginBottom: 16,
  },
  logoGrad: {
    width: 80,
    height: 80,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  titleWrap: {
    alignItems: "center",
    marginBottom: 28,
    gap: 8,
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 34,
    color: C.text,
    letterSpacing: -0.5,
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  taglineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.teal,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.teal,
  },
  heroCard: {
    marginHorizontal: 20,
    backgroundColor: C.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 12,
    marginBottom: 24,
  },
  heroText: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: C.text,
    lineHeight: 30,
  },
  heroBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: C.textSecondary,
    lineHeight: 24,
  },
  heroEmphasis: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: C.accent,
    lineHeight: 24,
  },
  featureList: {
    marginHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textSecondary,
    flex: 1,
    lineHeight: 21,
  },
  disclaimer: {
    flexDirection: "row",
    gap: 6,
    alignItems: "flex-start",
    marginHorizontal: 20,
    marginBottom: 8,
  },
  disclaimerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textTertiary,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.separator,
    backgroundColor: C.background,
    gap: 10,
    alignItems: "center",
  },
  footerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textTertiary,
  },
});
