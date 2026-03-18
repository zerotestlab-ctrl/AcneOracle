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
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 3000 + Math.random() * 1000 }),
        withTiming(0.3, { duration: 3000 + Math.random() * 1000 })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, style, { top, left }]}>
      <LinearGradient
        colors={[color + "30", color + "00"]}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    </Animated.View>
  );
}

export default function IntroScreen() {
  const insets = useSafeAreaInsets();
  const { markIntroSeen } = useApp();
  const topPad = Platform.OS === "web" ? 40 : insets.top;
  const botPad = Platform.OS === "web" ? 40 : insets.bottom;

  const handleStart = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await markIntroSeen();
    router.replace("/onboarding");
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <SoftOrb top={-60} left={-60} color="#FF6B6B" size={280} />
      <SoftOrb top={200} left={width - 160} color="#A78BFA" size={220} />
      <SoftOrb top={480} left={-40} color="#00C9A7" size={200} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 32, paddingBottom: botPad + 120 }]}
      >
        <Animated.View entering={FadeIn.delay(100).springify()} style={styles.badge}>
          <Text style={styles.badgeText}>AI Skin Coach</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.titleBlock}>
          <Text style={styles.appName}>AcneOracle</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.heroBlock}>
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

        <Animated.View entering={FadeInDown.delay(520).springify()} style={styles.pillRow}>
          {["AI photo analysis", "Track every penny", "Honest advice", "You're not alone"].map((p) => (
            <View key={p} style={styles.pill}>
              <Text style={styles.pillText}>{p}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeIn.delay(700).springify()} style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            AI wellness coach only — not a doctor. Always consult a dermatologist for medical decisions.
          </Text>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInDown.delay(600).springify()}
        style={[styles.footer, { paddingBottom: botPad + 20 }]}
      >
        <LinearGradient
          colors={["transparent", C.background + "EE", C.background]}
          style={styles.footerGrad}
        />
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
  scroll: {
    paddingHorizontal: 28,
    gap: 28,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: C.accent + "20",
    borderRadius: 50,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.accent + "40",
  },
  badgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: C.accent,
    letterSpacing: 0.5,
  },
  titleBlock: {
    gap: 4,
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 44,
    color: C.text,
    letterSpacing: -1,
    lineHeight: 52,
  },
  heroBlock: {
    gap: 20,
  },
  heroHeadline: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: C.text,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  heroBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: C.textSecondary,
    lineHeight: 28,
  },
  heroAccent: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: C.teal,
    lineHeight: 26,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pill: {
    backgroundColor: C.card,
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 9,
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    paddingTop: 24,
    gap: 10,
    alignItems: "center",
  },
  footerGrad: {
    position: "absolute",
    top: -40,
    left: 0,
    right: 0,
    height: 40,
  },
  footerSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textTertiary,
  },
});
