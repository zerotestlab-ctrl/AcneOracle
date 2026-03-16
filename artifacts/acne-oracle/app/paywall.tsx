import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import Colors from "@/constants/colors";
import { useSubscription } from "@/lib/revenuecat";
import { useApp } from "@/context/AppContext";
import { GradientButton } from "@/components/ui/GradientButton";

const C = Colors.dark;

const FEATURES = [
  { icon: "scan", text: "Unlimited daily skin scans", color: C.accent },
  { icon: "analytics", text: "Full acne type + severity history", color: "#FF8E53" },
  { icon: "flask", text: "AI product correlation insights", color: C.teal },
  { icon: "sparkles", text: "Before/after skin simulation", color: "#A855F7" },
  { icon: "chatbubble-ellipses", text: "Unlimited AI coach conversations", color: C.teal },
  { icon: "wallet", text: "Smart skincare spending insights", color: C.success },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { isSubscribed, offerings, purchase, isPurchasing, restore, isRestoring, revenueCatEnabled } = useSubscription();
  const { setIsPremium } = useApp();
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const currentOffering = offerings?.current;
  const packages = currentOffering?.availablePackages ?? [];
  const mainPackage = packages[0];

  const priceString = mainPackage?.product?.priceString ?? "$5.99";
  const productTitle = mainPackage?.product?.title ?? "AcneOracle Premium";

  const handlePurchase = () => {
    if (!mainPackage) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPkg(mainPackage);
    setShowConfirm(true);
  };

  const confirmPurchase = async () => {
    setShowConfirm(false);
    if (!selectedPkg) return;
    try {
      await purchase(selectedPkg);
      setIsPremium(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      console.error("Purchase error:", err);
    }
  };

  const handleRestore = async () => {
    try {
      await restore();
    } catch {}
  };

  if (isSubscribed) {
    return (
      <View style={[styles.root, { backgroundColor: C.background }]}>
        <Pressable style={[styles.closeBtn, { top: topPad + 8 }]} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={C.text} />
        </Pressable>
        <View style={styles.alreadyPremium}>
          <Animated.View entering={ZoomIn.springify()}>
            <LinearGradient colors={C.accentGradient} style={styles.successIcon}>
              <Ionicons name="star" size={40} color="#fff" />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.alreadyTitle}>You're Premium!</Text>
          <Text style={styles.alreadySub}>Enjoy unlimited skin scanning and AI coaching.</Text>
          <GradientButton label="Continue" onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <Pressable style={[styles.closeBtn, { top: topPad + 8 }]} onPress={() => router.back()}>
        <Ionicons name="close" size={22} color={C.text} />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPad + 60, paddingBottom: botPad + 40, paddingHorizontal: 16 }}
      >
        <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.hero}>
          <LinearGradient
            colors={["#FF6B6B20", "#FF8E5308"]}
            style={styles.heroGrad}
          >
            <LinearGradient colors={C.accentGradient} style={styles.heroIcon}>
              <Ionicons name="star" size={36} color="#fff" />
            </LinearGradient>
            <Text style={styles.heroTitle}>AcneOracle Pro</Text>
            <Text style={styles.heroSub}>Your complete AI skin wellness companion</Text>

            <View style={styles.priceBadge}>
              <Text style={styles.priceMain}>{priceString}</Text>
              <Text style={styles.pricePer}>/month</Text>
            </View>

            <View style={styles.trialBadge}>
              <Ionicons name="gift" size={14} color={C.accent} />
              <Text style={styles.trialText}>First month only $2.99 · Cancel anytime</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>Everything included</Text>
          {FEATURES.map((f, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(100 + i * 40).springify()} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: f.color + "20" }]}>
                <Ionicons name={f.icon as any} size={18} color={f.color} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
              <Ionicons name="checkmark-circle" size={16} color={C.success} />
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.disclaimer}>
          <Ionicons name="shield-checkmark" size={14} color={C.textTertiary} />
          <Text style={styles.disclaimerText}>
            AcneOracle is a wellness coach, not a medical doctor. Results may vary. Always consult a dermatologist for medical concerns.
          </Text>
        </Animated.View>

        <View style={styles.bottomActions}>
          {revenueCatEnabled ? (
            <GradientButton
              label={isPurchasing ? "Processing..." : `Start for ${priceString}/mo`}
              onPress={handlePurchase}
              loading={isPurchasing}
              disabled={!mainPackage}
              size="lg"
            />
          ) : (
            <View style={styles.noPayments}>
              <Text style={styles.noPaymentsText}>
                Subscription billing will be available after RevenueCat integration setup.
              </Text>
            </View>
          )}

          <Pressable onPress={handleRestore} style={styles.restoreBtn}>
            {isRestoring ? (
              <ActivityIndicator size="small" color={C.textSecondary} />
            ) : (
              <Text style={styles.restoreText}>Restore Purchase</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={showConfirm}
        animationType="fade"
        transparent
        onRequestClose={() => setShowConfirm(false)}
      >
        <View style={styles.confirmOverlay}>
          <Animated.View entering={ZoomIn.springify()} style={[styles.confirmSheet, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.confirmTitle}>Confirm Purchase</Text>
            <Text style={styles.confirmSub}>
              Subscribe to AcneOracle Pro for {priceString}/month?
              {"\n"}First month is just $2.99.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable style={styles.confirmCancel} onPress={() => setShowConfirm(false)}>
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </Pressable>
              <GradientButton label="Subscribe" onPress={confirmPurchase} style={{ flex: 1 }} />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: {
    position: "absolute", left: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  alreadyPremium: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 32 },
  successIcon: { width: 90, height: 90, borderRadius: 26, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  alreadyTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: C.text },
  alreadySub: { fontFamily: "Inter_400Regular", fontSize: 15, color: C.textSecondary, textAlign: "center" },
  hero: {
    borderRadius: 24, overflow: "hidden",
    borderWidth: 1, borderColor: C.accent + "30", marginBottom: 16,
  },
  heroGrad: { padding: 28, alignItems: "center", gap: 10 },
  heroIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 28, color: C.text },
  heroSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, textAlign: "center" },
  priceBadge: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 6 },
  priceMain: { fontFamily: "Inter_700Bold", fontSize: 40, color: C.text },
  pricePer: { fontFamily: "Inter_400Regular", fontSize: 16, color: C.textSecondary },
  trialBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.accent + "18", paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 12, borderWidth: 1, borderColor: C.accent + "40",
  },
  trialText: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.accent },
  featuresCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: C.cardBorder, gap: 14, marginBottom: 16,
  },
  featuresTitle: { fontFamily: "Inter_700Bold", fontSize: 17, color: C.text, marginBottom: 4 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  featureText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, flex: 1 },
  disclaimer: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.cardBorder, marginBottom: 20,
  },
  disclaimerText: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary, flex: 1, lineHeight: 18 },
  bottomActions: { gap: 12 },
  restoreBtn: { alignSelf: "center", paddingVertical: 8 },
  restoreText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textSecondary },
  noPayments: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.cardBorder, alignItems: "center",
  },
  noPaymentsText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, textAlign: "center", lineHeight: 20 },
  confirmOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  confirmSheet: {
    backgroundColor: C.backgroundSecondary, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, gap: 12,
  },
  confirmTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text },
  confirmSub: { fontFamily: "Inter_400Regular", fontSize: 15, color: C.textSecondary, lineHeight: 22 },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  confirmCancel: {
    flex: 1, height: 54, borderRadius: 16,
    backgroundColor: C.backgroundTertiary, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: C.separator,
  },
  confirmCancelText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.textSecondary },
});
