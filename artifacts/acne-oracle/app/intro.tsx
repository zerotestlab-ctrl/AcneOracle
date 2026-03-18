import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
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

function SoftOrb({ top, left, color, size }: { top: number; left: number; color: string; size: number }) {
  const opacity = useSharedValue(0.28);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 3500 }),
        withTiming(0.28, { duration: 3500 })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, style, { top, left, position: "absolute" }]}>
      <LinearGradient
        colors={[color + "40", color + "00"]}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    </Animated.View>
  );
}

export default function IntroScreen() {
  const insets = useSafeAreaInsets();
  const { markIntroSeen } = useApp();

  const handleStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await markIntroSeen();
    router.replace("/onboarding");
  };

  const topPad = insets.top + 24;
  const botPad = Math.max(insets.bottom, 16);

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      {/* Ambient orbs */}
      <SoftOrb top={-40} left={-60} color="#FF6B6B" size={260} />
      <SoftOrb top={180} left={width - 140} color="#A78BFA" size={200} />
      <SoftOrb top={460} left={-30} color="#00C9A7" size={180} />

      {/* Scrollable content */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: 16 }]}
      >
        <Animated.View entering={FadeIn.delay(80).springify()} style={styles.badge}>
          <Text style={styles.badgeText}>AI Skin Coach</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).springify()} style={styles.titleBlock}>
          <Text style={styles.appName}>AcneOracle</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.heroBlock}>
          <Text style={styles.heroHeadline}>
            Welcome to AcneOracle – the AI skin coach made for women who are done wasting time and money on acne.
          </Text>
          <Text style={styles.heroBody}>
            I truly understand your journey, analyse your real photos, track every penny you spend, and give honest, caring advice that finally clears your skin so you feel confident again.
          </Text>
          <Text style={styles.heroAccent}>
            You're not alone – let's make this the last app you ever need.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.pillRow}>
          {["AI photo analysis", "Track every penny", "Honest advice", "You're not alone"].map((p) => (
            <View key={p} style={styles.pill}>
              <Text style={styles.pillText}>{p}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeIn.delay(600).springify()} style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            AI wellness coach only — not a doctor. Always consult a dermatologist for medical decisions.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Footer — sits BELOW scroll, never overlaps */}
      <Animated.View
        entering={FadeInDown.delay(500).springify()}
        style={[styles.footer, { paddingBottom: botPad }]}
      >
        <GradientButton
          label="Get Started"
          onPress={handleStart}
          size="lg"
          style={{ borderRadius: 18 }}
        />
        <Text style={styles.footerSub}>Free to start · No credit card required</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
  },
  scroll: {
    paddingHorizontal: 26,
    gap: 24,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: C.accent + "20",
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: C.accent + "40",
  },
  badgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.accent,
    letterSpacing: 0.5,
  },

  titleBlock: {},
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 42,
    color: C.text,
    letterSpacing: -1,
    lineHeight: 50,
  },

  heroBlock: {
    gap: 18,
  },
  heroHeadline: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: C.text,
    lineHeight: 33,
    letterSpacing: -0.3,
  },
  heroBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: C.textSecondary,
    lineHeight: 26,
  },
  heroAccent: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: C.teal,
    lineHeight: 25,
  },

  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    backgroundColor: C.card,
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  pillText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: C.textSecondary,
  },

  disclaimer: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  disclaimerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textTertiary,
    lineHeight: 18,
    textAlign: "center",
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 14,
    gap: 10,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.separator,
    backgroundColor: C.background,
  },
  footerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textTertiary,
  },
});
