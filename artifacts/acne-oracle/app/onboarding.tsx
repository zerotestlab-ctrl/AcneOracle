import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeOutLeft,
  SlideInRight,
  SlideOutLeft,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientButton } from "@/components/ui/GradientButton";
import Colors from "@/constants/colors";
import { useApp, type SkinTone, type UserProfile } from "@/context/AppContext";

const C = Colors.dark;
const { width, height } = Dimensions.get("window");

const TOTAL_STEPS = 6;

const SKIN_TONES: { id: SkinTone; label: string; emoji: string; hex: string; subLabel: string }[] = [
  { id: "fair", label: "Fair", emoji: "☁️", hex: "#F8D5B8", subLabel: "Very light, burns easily" },
  { id: "light", label: "Light", emoji: "🌤️", hex: "#E8B896", subLabel: "Light, sometimes burns" },
  { id: "medium", label: "Medium", emoji: "⛅", hex: "#C8906A", subLabel: "Medium, tans gradually" },
  { id: "olive", label: "Olive", emoji: "🌿", hex: "#A0724A", subLabel: "Olive, rarely burns" },
  { id: "brown", label: "Brown", emoji: "🌰", hex: "#7A4E2D", subLabel: "Brown, tans easily" },
  { id: "deep", label: "Deep", emoji: "🌑", hex: "#4A2810", subLabel: "Deep, never burns" },
];

const YEARS_OPTIONS = [
  { label: "Less than 1 year", value: 0.5, emoji: "🌱" },
  { label: "1–2 years", value: 1.5, emoji: "📅" },
  { label: "3–5 years", value: 4, emoji: "⏳" },
  { label: "6–10 years", value: 8, emoji: "😔" },
  { label: "10+ years", value: 12, emoji: "💪" },
];

const SPEND_OPTIONS = [
  { label: "Under $50", value: 40, emoji: "💸" },
  { label: "$50–$150", value: 100, emoji: "💳" },
  { label: "$150–$300", value: 225, emoji: "🤑" },
  { label: "$300–$600", value: 450, emoji: "😬" },
  { label: "$600+", value: 750, emoji: "😱" },
];

function ProgressBar({ step }: { step: number }) {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            i < step ? styles.progressActive : styles.progressInactive,
          ]}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();

  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [skinTone, setSkinTone] = useState<SkinTone | null>(null);
  const [yearsWithAcne, setYearsWithAcne] = useState<number | null>(null);
  const [currentCream, setCurrentCream] = useState("");
  const [annualSpend, setAnnualSpend] = useState<number | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const topPad = Platform.OS === "web" ? 16 : insets.top;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom;

  const canProceed = () => {
    if (step === 0) return true;
    if (step === 1) return nickname.trim().length >= 1;
    if (step === 2) return skinTone !== null;
    if (step === 3) return yearsWithAcne !== null;
    if (step === 4) return currentCream.trim().length >= 1 && annualSpend !== null;
    if (step === 5) return selfieUri !== null;
    return false;
  };

  const handleNext = () => {
    if (!canProceed()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep((s) => s - 1);
    }
  };

  const handleComplete = async () => {
    if (!nickname || !skinTone || yearsWithAcne === null || !currentCream || annualSpend === null) return;
    setCompleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const profile: UserProfile = {
      nickname: nickname.trim(),
      skinTone,
      yearsWithAcne,
      currentCream: currentCream.trim(),
      annualSpend,
    };

    await completeOnboarding(profile);
    router.replace({ pathname: "/welcome", params: { selfieBase64: selfieBase64 ?? "", selfieUri: selfieUri ?? "" } });
  };

  const takeSelfie = async (fromCamera: boolean) => {
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") return;
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") return;
    }

    const result = await (fromCamera
      ? ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
          base64: true,
          skipProcessing: true,
        })
      : ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
          base64: true,
          skipProcessing: true,
        }));

    if (!result.canceled && result.assets[0]) {
      setSelfieUri(result.assets[0].uri);
      setSelfieBase64(result.assets[0].base64 ?? null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      {/* Step 0: Landing */}
      {step === 0 && (
        <Animated.View entering={FadeIn.springify()} style={[styles.landingContainer, { paddingTop: topPad + 20, paddingBottom: botPad + 20 }]}>
          <LinearGradient
            colors={["#FF6B6B10", "#00C9A708", "#080B10"]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.landingContent}>
            <LinearGradient colors={C.accentGradient} style={styles.landingIcon}>
              <Ionicons name="sparkles" size={44} color="#fff" />
            </LinearGradient>
            <Text style={styles.landingTitle}>Meet AcneOracle</Text>
            <Text style={styles.landingTagline}>
              Your personal AI skin coach — built to finally get your acne under control
            </Text>
            <View style={styles.landingFeatures}>
              {[
                { icon: "scan", text: "AI-powered skin analysis on every scan" },
                { icon: "wallet", text: "Stop wasting money on products that don't work" },
                { icon: "heart", text: "Personalised, warm advice just for you" },
              ].map((f, i) => (
                <Animated.View key={i} entering={FadeInDown.delay(200 + i * 100).springify()} style={styles.featureRow}>
                  <View style={styles.featureIconBg}>
                    <Ionicons name={f.icon as any} size={18} color={C.accent} />
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </Animated.View>
              ))}
            </View>
            <Text style={styles.landingDisclaimer}>
              Wellness coach only · Not a medical doctor
            </Text>
          </View>
          <View style={styles.landingActions}>
            <GradientButton label="Get Started 🙌" onPress={handleNext} size="lg" />
          </View>
        </Animated.View>
      )}

      {/* Steps 1–5 */}
      {step > 0 && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={[styles.stepContainer, { paddingTop: topPad + 12, paddingBottom: botPad + 12 }]}>
            {/* Header */}
            <View style={styles.stepHeader}>
              <Pressable onPress={handleBack} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color={C.text} />
              </Pressable>
              <ProgressBar step={step} />
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Step 1: Name */}
              {step === 1 && (
                <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                  <Text style={styles.stepEmoji}>👋</Text>
                  <Text style={styles.stepTitle}>Hey friend! What's your name?</Text>
                  <Text style={styles.stepSubtitle}>
                    Or a fun nickname I can use to cheer you on 😊
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="e.g. Alex, Sunshine, Warrior 💪"
                    placeholderTextColor={C.textTertiary}
                    autoFocus
                    returnKeyType="next"
                    maxLength={30}
                  />
                  {nickname.length > 0 && (
                    <Animated.Text entering={FadeIn.springify()} style={styles.previewText}>
                      Hey {nickname}! I'm so glad you're here. 🌟
                    </Animated.Text>
                  )}
                </Animated.View>
              )}

              {/* Step 2: Skin tone */}
              {step === 2 && (
                <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                  <Text style={styles.stepEmoji}>🎨</Text>
                  <Text style={styles.stepTitle}>Which skin tone feels most like you?</Text>
                  <Text style={styles.stepSubtitle}>
                    This helps me understand your skin better — and tailor advice that actually works for you
                  </Text>
                  <View style={styles.skinToneGrid}>
                    {SKIN_TONES.map((tone) => (
                      <Pressable
                        key={tone.id}
                        style={[
                          styles.skinToneCard,
                          skinTone === tone.id && styles.skinToneCardActive,
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSkinTone(tone.id);
                        }}
                      >
                        <View style={[styles.skinSwatch, { backgroundColor: tone.hex }]} />
                        <Text style={styles.skinToneLabel}>{tone.label}</Text>
                        <Text style={styles.skinToneSubLabel}>{tone.subLabel}</Text>
                        {skinTone === tone.id && (
                          <View style={styles.skinToneCheck}>
                            <Ionicons name="checkmark" size={14} color="#fff" />
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}

              {/* Step 3: Years with acne */}
              {step === 3 && (
                <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                  <Text style={styles.stepEmoji}>⏳</Text>
                  <Text style={styles.stepTitle}>How long have you been on this acne journey?</Text>
                  <Text style={styles.stepSubtitle}>
                    Be honest – I've got your back no matter what! 💙
                  </Text>
                  <View style={styles.optionList}>
                    {YEARS_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.value}
                        style={[
                          styles.optionCard,
                          yearsWithAcne === opt.value && styles.optionCardActive,
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setYearsWithAcne(opt.value);
                        }}
                      >
                        <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                        <Text style={[styles.optionLabel, yearsWithAcne === opt.value && styles.optionLabelActive]}>
                          {opt.label}
                        </Text>
                        {yearsWithAcne === opt.value && (
                          <Ionicons name="checkmark-circle" size={22} color={C.accent} />
                        )}
                      </Pressable>
                    ))}
                  </View>
                  {yearsWithAcne !== null && yearsWithAcne >= 4 && (
                    <Animated.View entering={FadeIn.springify()} style={styles.empathyCard}>
                      <Text style={styles.empathyText}>
                        {yearsWithAcne >= 10
                          ? "That's a long time to carry this. I'm genuinely proud of you for still fighting. 💪"
                          : "Years of dealing with this builds real resilience. You've got this. ✨"}
                      </Text>
                    </Animated.View>
                  )}
                </Animated.View>
              )}

              {/* Step 4: Current cream + spending */}
              {step === 4 && (
                <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                  <Text style={styles.stepEmoji}>💊</Text>
                  <Text style={styles.stepTitle}>What's your main skincare product right now?</Text>
                  <Text style={styles.stepSubtitle}>
                    And roughly how much have you spent on skincare this year?
                    {"\n"}(This is key — I want to help you stop wasting money 💰)
                  </Text>
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Main cream or serum</Text>
                    <TextInput
                      style={styles.textInput}
                      value={currentCream}
                      onChangeText={setCurrentCream}
                      placeholder="e.g. Benzoyl Peroxide, Differin, CeraVe..."
                      placeholderTextColor={C.textTertiary}
                      returnKeyType="done"
                      maxLength={60}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Annual skincare spend (last 12 months)</Text>
                    <View style={styles.spendGrid}>
                      {SPEND_OPTIONS.map((opt) => (
                        <Pressable
                          key={opt.value}
                          style={[
                            styles.spendChip,
                            annualSpend === opt.value && styles.spendChipActive,
                          ]}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setAnnualSpend(opt.value);
                          }}
                        >
                          <Text style={styles.spendEmoji}>{opt.emoji}</Text>
                          <Text style={[styles.spendLabel, annualSpend === opt.value && styles.spendLabelActive]}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {annualSpend !== null && annualSpend >= 225 && (
                    <Animated.View entering={FadeIn.springify()} style={[styles.empathyCard, { borderColor: "#FF8E5344" }]}>
                      <Ionicons name="bulb" size={16} color="#FF8E53" />
                      <Text style={[styles.empathyText, { color: "#FF8E53" }]}>
                        ${annualSpend} a year is a lot. I'll help you figure out what's actually working — and what to cut.
                      </Text>
                    </Animated.View>
                  )}
                </Animated.View>
              )}

              {/* Step 5: Camera */}
              {step === 5 && (
                <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                  <Text style={styles.stepEmoji}>📸</Text>
                  <Text style={styles.stepTitle}>Time to meet your skin!</Text>
                  <Text style={styles.stepSubtitle}>
                    Snap a clear selfie of your face. I'll use this for your first AI analysis ✨
                  </Text>

                  <View style={styles.cameraTips}>
                    {[
                      { icon: "sunny", tip: "Natural light or bright room" },
                      { icon: "person", tip: "Face forward, fill the frame" },
                      { icon: "color-palette", tip: "Works for every skin tone" },
                      { icon: "eye-off", tip: "Remove glasses if possible" },
                    ].map((t, i) => (
                      <View key={i} style={styles.cameraTipRow}>
                        <Ionicons name={t.icon as any} size={15} color={C.teal} />
                        <Text style={styles.cameraTipText}>{t.tip}</Text>
                      </View>
                    ))}
                  </View>

                  {selfieUri ? (
                    <Animated.View entering={FadeIn.springify()} style={styles.selfiePreview}>
                      <Image source={{ uri: selfieUri }} style={styles.selfieImg} contentFit="cover" />
                      <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)"]} style={styles.selfieOverlay}>
                        <View style={styles.selfieSuccessRow}>
                          <Ionicons name="checkmark-circle" size={20} color={C.success} />
                          <Text style={styles.selfieSuccessText}>Looking great!</Text>
                        </View>
                        <Pressable onPress={() => { setSelfieUri(null); setSelfieBase64(null); }}>
                          <Text style={styles.retakeText}>Retake</Text>
                        </Pressable>
                      </LinearGradient>
                    </Animated.View>
                  ) : (
                    <View style={styles.selfieButtons}>
                      <GradientButton
                        label="📷  Take Selfie"
                        onPress={() => takeSelfie(true)}
                        style={{ flex: 1 }}
                      />
                      <GradientButton
                        label="🖼️  Choose Photo"
                        onPress={() => takeSelfie(false)}
                        variant="outline"
                        style={{ flex: 1 }}
                      />
                    </View>
                  )}
                </Animated.View>
              )}
            </ScrollView>

            {/* Bottom action */}
            <View style={styles.stepFooter}>
              {step < TOTAL_STEPS - 1 ? (
                <GradientButton
                  label="Continue →"
                  onPress={handleNext}
                  disabled={!canProceed()}
                  size="lg"
                />
              ) : (
                <GradientButton
                  label={completing ? "Setting up your profile..." : "Complete — let's go! 🚀"}
                  onPress={handleComplete}
                  disabled={!canProceed() || completing}
                  loading={completing}
                  size="lg"
                />
              )}
              {step < TOTAL_STEPS - 1 && step !== 5 && (
                <Pressable onPress={handleNext} style={styles.skipBtn}>
                  <Text style={styles.skipText}>Skip for now</Text>
                </Pressable>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Landing (step 0)
  landingContainer: { flex: 1, justifyContent: "space-between", paddingHorizontal: 24 },
  landingContent: { flex: 1, alignItems: "center", justifyContent: "center", gap: 20 },
  landingIcon: {
    width: 96, height: 96, borderRadius: 30,
    justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  landingTitle: { fontFamily: "Inter_700Bold", fontSize: 32, color: C.text, textAlign: "center" },
  landingTagline: {
    fontFamily: "Inter_400Regular", fontSize: 16, color: C.textSecondary,
    textAlign: "center", lineHeight: 24, marginTop: -4,
  },
  landingFeatures: { width: "100%", gap: 12, marginTop: 8 },
  featureRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  featureIconBg: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.accent + "20",
    justifyContent: "center", alignItems: "center",
  },
  featureText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, flex: 1 },
  landingDisclaimer: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary, marginTop: 4 },
  landingActions: { gap: 12 },

  // Step wrapper
  stepContainer: { flex: 1 },
  stepHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  progressContainer: { flex: 1, flexDirection: "row", gap: 6 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  progressActive: { backgroundColor: C.accent },
  progressInactive: { backgroundColor: C.backgroundTertiary },

  // Step content
  stepContent: { gap: 20, paddingTop: 8 },
  stepEmoji: { fontSize: 44 },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: C.text, lineHeight: 32 },
  stepSubtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: C.textSecondary, lineHeight: 22, marginTop: -8 },

  textInput: {
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    borderRadius: 16, padding: 16, fontSize: 16,
    fontFamily: "Inter_400Regular", color: C.text,
  },
  previewText: {
    fontFamily: "Inter_500Medium", fontSize: 15, color: C.teal,
    backgroundColor: C.teal + "15", paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, overflow: "hidden",
  },

  // Skin tone grid
  skinToneGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  skinToneCard: {
    width: (width - 40 - 10) / 2,
    backgroundColor: C.card, borderRadius: 18, padding: 14,
    borderWidth: 1.5, borderColor: C.cardBorder,
    gap: 8, position: "relative",
  },
  skinToneCardActive: { borderColor: C.accent, backgroundColor: C.accent + "12" },
  skinSwatch: { width: 44, height: 44, borderRadius: 12 },
  skinToneLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.text },
  skinToneSubLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textSecondary },
  skinToneCheck: {
    position: "absolute", top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11, backgroundColor: C.accent,
    justifyContent: "center", alignItems: "center",
  },

  // Options list
  optionList: { gap: 10 },
  optionCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: C.cardBorder,
  },
  optionCardActive: { borderColor: C.accent, backgroundColor: C.accent + "10" },
  optionEmoji: { fontSize: 22 },
  optionLabel: { fontFamily: "Inter_500Medium", fontSize: 15, color: C.textSecondary, flex: 1 },
  optionLabelActive: { color: C.text },

  empathyCard: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: C.teal + "12", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.teal + "30",
  },
  empathyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.teal, flex: 1, lineHeight: 21 },

  // Step 4
  formGroup: { gap: 10 },
  inputLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textSecondary },
  spendGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  spendChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: C.cardBorder,
  },
  spendChipActive: { borderColor: C.accent, backgroundColor: C.accent + "15" },
  spendEmoji: { fontSize: 16 },
  spendLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textSecondary },
  spendLabelActive: { color: C.text },

  // Step 5 (camera)
  cameraTips: {
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.cardBorder, gap: 10,
  },
  cameraTipRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cameraTipText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary },
  selfiePreview: {
    borderRadius: 24, overflow: "hidden",
    aspectRatio: 1, position: "relative",
  },
  selfieImg: { width: "100%", height: "100%" },
  selfieOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  selfieSuccessRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  selfieSuccessText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  retakeText: { fontFamily: "Inter_500Medium", fontSize: 13, color: "rgba(255,255,255,0.8)" },
  selfieButtons: { flexDirection: "row", gap: 10 },

  // Footer
  stepFooter: { paddingHorizontal: 20, paddingTop: 12, gap: 8 },
  skipBtn: { alignSelf: "center", paddingVertical: 8 },
  skipText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textTertiary },
});
