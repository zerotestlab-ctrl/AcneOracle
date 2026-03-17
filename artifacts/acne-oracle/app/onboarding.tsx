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
  SlideInRight,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientButton } from "@/components/ui/GradientButton";
import Colors from "@/constants/colors";
import { useApp, type AcneVariant, type SkinTone, type UserProfile } from "@/context/AppContext";

const C = Colors.dark;
const { width } = Dimensions.get("window");

const QUESTION_STEPS = 7;

const SKIN_TONES: { id: SkinTone; label: string; hex: string; subLabel: string }[] = [
  { id: "fair",   label: "Fair",   hex: "#F8D5B8", subLabel: "Very light, burns easily" },
  { id: "light",  label: "Light",  hex: "#E8B896", subLabel: "Light, sometimes burns" },
  { id: "medium", label: "Medium", hex: "#C8906A", subLabel: "Medium, tans gradually" },
  { id: "olive",  label: "Olive",  hex: "#A0724A", subLabel: "Olive, rarely burns" },
  { id: "brown",  label: "Brown",  hex: "#7A4E2D", subLabel: "Brown, tans easily" },
  { id: "deep",   label: "Deep",   hex: "#3A1E0A", subLabel: "Deep, never burns" },
];

const AGE_OPTIONS = [
  "Under 16", "16–20", "21–25", "26–30", "31–35", "36+"
];

const ACNE_TYPES: { id: AcneVariant; label: string; desc: string; icon: string }[] = [
  { id: "comedonal",    label: "Blackheads & whiteheads", desc: "Clogged pores, non-inflamed",     icon: "ellipse" },
  { id: "inflammatory", label: "Red, inflamed bumps",      desc: "Papules and pustules",            icon: "flame" },
  { id: "cystic",       label: "Deep, painful cysts",      desc: "Large, under-the-skin lumps",    icon: "warning" },
  { id: "hormonal",     label: "Hormonal (chin & jaw)",    desc: "Flares with your cycle",         icon: "sync" },
  { id: "body",         label: "Body acne",                desc: "Back, chest or shoulders",       icon: "body" },
  { id: "mixed",        label: "All mixed up",             desc: "A bit of everything",            icon: "grid" },
];

const YEARS_OPTIONS = [
  { label: "Less than 1 year", value: 0.5, emoji: "🌱" },
  { label: "1–2 years",        value: 1.5, emoji: "📅" },
  { label: "3–5 years",        value: 4,   emoji: "⏳" },
  { label: "6–10 years",       value: 8,   emoji: "😔" },
  { label: "10+ years",        value: 12,  emoji: "💪" },
];

const FRUSTRATIONS = [
  "Nothing seems to work",
  "Scars and dark marks",
  "It keeps coming back",
  "I've spent so much money",
  "It's killing my confidence",
  "Painful and uncomfortable",
];

const SPEND_OPTIONS = [
  { label: "Under $50",   value: 40,  emoji: "💸" },
  { label: "$50–$150",    value: 100, emoji: "💳" },
  { label: "$150–$300",   value: 225, emoji: "🤑" },
  { label: "$300–$600",   value: 450, emoji: "😬" },
  { label: "$600+",       value: 750, emoji: "😱" },
];

function ProgressBar({ step }: { step: number }) {
  return (
    <View style={styles.progressContainer}>
      {Array.from({ length: QUESTION_STEPS }).map((_, i) => (
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
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState<string | null>(null);
  const [skinTone, setSkinTone] = useState<SkinTone | null>(null);
  const [acneTypes, setAcneTypes] = useState<AcneVariant[]>([]);
  const [yearsWithAcne, setYearsWithAcne] = useState<number | null>(null);
  const [mainFrustration, setMainFrustration] = useState<string | null>(null);
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
    if (step === 2) return age !== null;
    if (step === 3) return skinTone !== null;
    if (step === 4) return acneTypes.length >= 1;
    if (step === 5) return yearsWithAcne !== null && mainFrustration !== null;
    if (step === 6) return currentCream.trim().length >= 1 && annualSpend !== null;
    if (step === 7) return selfieUri !== null;
    return false;
  };

  const toggleAcneType = (id: AcneVariant) => {
    Haptics.selectionAsync();
    setAcneTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (!canProceed()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < QUESTION_STEPS) {
      setStep((s) => s + 1);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), 50);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep((s) => s - 1);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), 50);
    }
  };

  const handleComplete = async () => {
    if (!nickname || !age || !skinTone || acneTypes.length === 0 || yearsWithAcne === null || !mainFrustration || !currentCream || annualSpend === null) return;
    setCompleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const profile: UserProfile = {
      nickname: nickname.trim(),
      age,
      skinTone,
      acneTypes,
      yearsWithAcne,
      mainFrustration,
      currentCream: currentCream.trim(),
      annualSpend,
    };

    await completeOnboarding(profile);
    router.replace({
      pathname: "/welcome",
      params: { selfieBase64: selfieBase64 ?? "", selfieUri: selfieUri ?? "" },
    });
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

      {/* ── Step 0: Landing ── */}
      {step === 0 && (
        <Animated.View
          entering={FadeIn.springify()}
          style={[styles.landingContainer, { paddingTop: topPad + 20, paddingBottom: botPad + 24 }]}
        >
          <LinearGradient
            colors={["#FF6B6B12", "#00C9A708", C.background]}
            locations={[0, 0.45, 1]}
            style={StyleSheet.absoluteFill}
          />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.landingScroll}
          >
            <LinearGradient colors={C.accentGradient} style={styles.landingIcon}>
              <Ionicons name="sparkles" size={44} color="#fff" />
            </LinearGradient>

            <Text style={styles.landingTitle}>Welcome to AcneOracle</Text>
            <Text style={styles.landingBody}>
              Your personal AI skin coach. I analyse your acne photos, track exactly what you spend on products, and give warm, honest advice on better routines, food, and smarter spending to finally clear your skin.
            </Text>
            <Text style={styles.landingBody}>
              No fluff, just real help.
            </Text>

            <View style={styles.landingFeatures}>
              {[
                { icon: "scan-outline",   text: "AI acne photo analysis — every scan" },
                { icon: "wallet-outline", text: "Track spending & find smarter swaps" },
                { icon: "heart-outline",  text: "Warm, honest advice tailored to you" },
                { icon: "trending-up",    text: "Weekly progress dashboard & streaks" },
              ].map((f, i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.delay(200 + i * 80).springify()}
                  style={styles.featureRow}
                >
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
          </ScrollView>

          <View style={[styles.landingActions, { paddingBottom: botPad + 8 }]}>
            <GradientButton label="Get Started" onPress={handleNext} size="lg" />
          </View>
        </Animated.View>
      )}

      {/* ── Steps 1–7 ── */}
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
              ref={scrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={styles.stepScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* ── Step 1: Name ── */}
              {step === 1 && (
                <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                  <Text style={styles.stepEmoji}>👋</Text>
                  <Text style={styles.stepTitle}>Hey friend! What's your real name or a fun nickname I can call you by?</Text>
                  <TextInput
                    style={styles.textInput}
                    value={nickname}
                    onChangeText={setNickname}
                    placeholder="e.g. Alex, Sunshine, Warrior..."
                    placeholderTextColor={C.textTertiary}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleNext}
                    maxLength={30}
                  />
                  {nickname.trim().length > 0 && (
                    <Animated.View entering={FadeIn.springify()} style={styles.previewBubble}>
                      <Text style={styles.previewText}>
                        Hey {nickname.trim()}! I'm so glad you're here. Let's get your skin sorted.
                      </Text>
                    </Animated.View>
                  )}
                </Animated.View>
              )}

              {/* ── Step 2: Age ── */}
              {step === 2 && (
                <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                  <Text style={styles.stepEmoji}>🎂</Text>
                  <Text style={styles.stepTitle}>How old are you?</Text>
                  <Text style={styles.stepSubtitle}>
                    This helps me understand things like hormones, which are a huge acne trigger at different life stages.
                  </Text>
                  <View style={styles.chipGrid}>
                    {AGE_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt}
                        style={[styles.chip, age === opt && styles.chipActive]}
                        onPress={() => { Haptics.selectionAsync(); setAge(opt); }}
                      >
                        <Text style={[styles.chipText, age === opt && styles.chipTextActive]}>
                          {opt}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  {age && age === "Under 16" && (
                    <Animated.View entering={FadeIn.springify()} style={styles.empathyCard}>
                      <Text style={styles.empathyText}>
                        Teen acne is incredibly common and very treatable. You're doing the right thing by taking it seriously early.
                      </Text>
                    </Animated.View>
                  )}
                  {age && (age === "31–35" || age === "36+") && (
                    <Animated.View entering={FadeIn.springify()} style={styles.empathyCard}>
                      <Text style={styles.empathyText}>
                        Adult acne is more common than people think. Hormones, stress, and diet all play a role — I'll help you figure out your triggers.
                      </Text>
                    </Animated.View>
                  )}
                </Animated.View>
              )}

              {/* ── Step 3: Skin tone ── */}
              {step === 3 && (
                <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                  <Text style={styles.stepEmoji}>🎨</Text>
                  <Text style={styles.stepTitle}>Which skin tone feels most like yours?</Text>
                  <Text style={styles.stepSubtitle}>
                    I'll tailor everything to you — treatments and products work differently depending on your skin tone.
                  </Text>
                  <View style={styles.skinToneGrid}>
                    {SKIN_TONES.map((tone) => (
                      <Pressable
                        key={tone.id}
                        style={[styles.skinToneCard, skinTone === tone.id && styles.skinToneCardActive]}
                        onPress={() => { Haptics.selectionAsync(); setSkinTone(tone.id); }}
                      >
                        <View style={[styles.skinSwatch, { backgroundColor: tone.hex }]} />
                        <Text style={styles.skinToneLabel}>{tone.label}</Text>
                        <Text style={styles.skinToneSubLabel}>{tone.subLabel}</Text>
                        {skinTone === tone.id && (
                          <View style={styles.skinToneCheck}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          </View>
                        )}
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}

              {/* ── Step 4: Acne type ── */}
              {step === 4 && (
                <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                  <Text style={styles.stepEmoji}>🔍</Text>
                  <Text style={styles.stepTitle}>What type of acne are you dealing with most right now?</Text>
                  <Text style={styles.stepSubtitle}>
                    Pick the one that matches best, or select more than one. No wrong answers here.
                  </Text>
                  <View style={styles.acneTypeList}>
                    {ACNE_TYPES.map((type) => {
                      const active = acneTypes.includes(type.id);
                      return (
                        <Pressable
                          key={type.id}
                          style={[styles.acneTypeCard, active && styles.acneTypeCardActive]}
                          onPress={() => toggleAcneType(type.id)}
                        >
                          <View style={[styles.acneTypeIconBg, active && styles.acneTypeIconBgActive]}>
                            <Ionicons name={type.icon as any} size={18} color={active ? "#fff" : C.textSecondary} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.acneTypeLabel, active && styles.acneTypeLabelActive]}>
                              {type.label}
                            </Text>
                            <Text style={styles.acneTypeDesc}>{type.desc}</Text>
                          </View>
                          {active && (
                            <Ionicons name="checkmark-circle" size={22} color={C.accent} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>
              )}

              {/* ── Step 5: Years + frustration ── */}
              {step === 5 && (
                <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                  <Text style={styles.stepEmoji}>⏳</Text>
                  <Text style={styles.stepTitle}>How many years have you been fighting acne?</Text>
                  <Text style={styles.stepSubtitle}>
                    And what's the one thing that frustrates you most? I want to understand how hard this has been.
                  </Text>
                  <View style={styles.optionList}>
                    {YEARS_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.value}
                        style={[styles.optionCard, yearsWithAcne === opt.value && styles.optionCardActive]}
                        onPress={() => { Haptics.selectionAsync(); setYearsWithAcne(opt.value); }}
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
                          ? "That's a long time to carry this. I'm genuinely proud of you for still fighting. You deserve results."
                          : "Years of this builds real resilience. Let's finally make it count."}
                      </Text>
                    </Animated.View>
                  )}

                  <Text style={[styles.inputLabel, { marginTop: 8 }]}>What frustrates you most?</Text>
                  <View style={styles.chipGrid}>
                    {FRUSTRATIONS.map((f) => (
                      <Pressable
                        key={f}
                        style={[styles.chip, mainFrustration === f && styles.chipActive]}
                        onPress={() => { Haptics.selectionAsync(); setMainFrustration(f); }}
                      >
                        <Text style={[styles.chipText, mainFrustration === f && styles.chipTextActive]}>
                          {f}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}

              {/* ── Step 6: Cream + spending ── */}
              {step === 6 && (
                <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                  <Text style={styles.stepEmoji}>💊</Text>
                  <Text style={styles.stepTitle}>What's the main cream or serum you're using right now?</Text>
                  <Text style={styles.stepSubtitle}>
                    And roughly how much have you spent on skincare in the last 12 months? I want to help you stop wasting money on things that aren't working.
                  </Text>
                  <View style={styles.formGroup}>
                    <Text style={styles.inputLabel}>Your main product</Text>
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
                    <Text style={styles.inputLabel}>Annual skincare spend</Text>
                    <View style={styles.spendGrid}>
                      {SPEND_OPTIONS.map((opt) => (
                        <Pressable
                          key={opt.value}
                          style={[styles.spendChip, annualSpend === opt.value && styles.spendChipActive]}
                          onPress={() => { Haptics.selectionAsync(); setAnnualSpend(opt.value); }}
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
                      <Ionicons name="bulb-outline" size={16} color="#FF8E53" />
                      <Text style={[styles.empathyText, { color: "#FF8E53", flex: 1 }]}>
                        ${annualSpend} a year is a lot. I'll be honest with you about what's working and what to cut.
                      </Text>
                    </Animated.View>
                  )}
                </Animated.View>
              )}

              {/* ── Step 7: Selfie ── */}
              {step === 7 && (
                <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                  <Text style={styles.stepEmoji}>📸</Text>
                  <Text style={styles.stepTitle}>Time to meet your skin!</Text>
                  <Text style={styles.stepSubtitle}>
                    Snap a clear selfie so I can run your first AI skin analysis. These tips work for every skin tone:
                  </Text>
                  <View style={styles.cameraTips}>
                    {[
                      { icon: "sunny-outline",         tip: "Natural light or a bright room" },
                      { icon: "person-outline",         tip: "Face forward, fill the frame" },
                      { icon: "color-palette-outline",  tip: "Works beautifully on every skin tone" },
                      { icon: "glasses-outline",        tip: "Remove glasses if possible" },
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
                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.65)"]}
                        style={styles.selfieOverlay}
                      >
                        <View style={styles.selfieSuccessRow}>
                          <Ionicons name="checkmark-circle" size={20} color={C.success} />
                          <Text style={styles.selfieSuccessText}>Perfect, looking great!</Text>
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
            <View style={[styles.stepFooter, { paddingBottom: Math.max(botPad, 16) }]}>
              {step < QUESTION_STEPS ? (
                <GradientButton
                  label="Continue"
                  onPress={handleNext}
                  disabled={!canProceed()}
                  size="lg"
                />
              ) : (
                <GradientButton
                  label={completing ? "Setting up your profile..." : "Complete Onboarding"}
                  onPress={handleComplete}
                  disabled={!canProceed() || completing}
                  loading={completing}
                  size="lg"
                />
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

  landingContainer: { flex: 1 },
  landingScroll: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 16,
    flexGrow: 1,
    justifyContent: "center",
  },
  landingIcon: {
    width: 96, height: 96, borderRadius: 30,
    justifyContent: "center", alignItems: "center",
    marginBottom: 4,
  },
  landingTitle: {
    fontFamily: "Inter_700Bold", fontSize: 30, color: C.text,
    textAlign: "center", lineHeight: 38,
  },
  landingBody: {
    fontFamily: "Inter_400Regular", fontSize: 16, color: C.textSecondary,
    textAlign: "center", lineHeight: 26, marginTop: -4,
  },
  landingFeatures: { width: "100%", gap: 10, marginTop: 4 },
  featureRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  featureIconBg: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.accent + "22",
    justifyContent: "center", alignItems: "center",
  },
  featureText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, flex: 1 },
  landingDisclaimer: {
    fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary,
    textAlign: "center", marginTop: 4,
  },
  landingActions: { paddingHorizontal: 24, gap: 12 },

  stepContainer: { flex: 1 },
  stepHeader: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, gap: 12, marginBottom: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  progressContainer: { flex: 1, flexDirection: "row", gap: 5 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  progressActive: { backgroundColor: C.accent },
  progressInactive: { backgroundColor: C.backgroundTertiary },

  stepScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  stepContent: { gap: 18, paddingTop: 4 },
  stepEmoji: { fontSize: 42 },
  stepTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: C.text, lineHeight: 30 },
  stepSubtitle: {
    fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary,
    lineHeight: 22, marginTop: -6,
  },

  textInput: {
    backgroundColor: C.inputBg, borderWidth: 1.5, borderColor: C.inputBorder,
    borderRadius: 16, padding: 16, fontSize: 16,
    fontFamily: "Inter_400Regular", color: C.text,
  },
  previewBubble: {
    backgroundColor: C.teal + "18", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.teal + "30",
  },
  previewText: {
    fontFamily: "Inter_500Medium", fontSize: 14, color: C.teal, lineHeight: 21,
  },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 50, borderWidth: 1.5, borderColor: C.cardBorder,
    backgroundColor: C.card,
  },
  chipActive: { borderColor: C.accent, backgroundColor: C.accent + "18" },
  chipText: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.textSecondary },
  chipTextActive: { color: C.accent },

  skinToneGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  skinToneCard: {
    width: (width - 40 - 10) / 2,
    backgroundColor: C.card, borderRadius: 18, padding: 14,
    borderWidth: 1.5, borderColor: C.cardBorder,
    gap: 6, position: "relative",
  },
  skinToneCardActive: { borderColor: C.accent, backgroundColor: C.accent + "12" },
  skinSwatch: { width: 44, height: 44, borderRadius: 12 },
  skinToneLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: C.text },
  skinToneSubLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary, lineHeight: 16 },
  skinToneCheck: {
    position: "absolute", top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.accent, justifyContent: "center", alignItems: "center",
  },

  acneTypeList: { gap: 10 },
  acneTypeCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.card, borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: C.cardBorder,
  },
  acneTypeCardActive: { borderColor: C.accent, backgroundColor: C.accent + "10" },
  acneTypeIconBg: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.backgroundTertiary,
    justifyContent: "center", alignItems: "center",
  },
  acneTypeIconBgActive: { backgroundColor: C.accent },
  acneTypeLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text },
  acneTypeLabelActive: { color: C.accent },
  acneTypeDesc: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary, marginTop: 1 },

  optionList: { gap: 10 },
  optionCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: C.cardBorder,
  },
  optionCardActive: { borderColor: C.accent, backgroundColor: C.accent + "10" },
  optionEmoji: { fontSize: 22 },
  optionLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: C.textSecondary, flex: 1 },
  optionLabelActive: { color: C.text },

  empathyCard: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: C.teal + "12", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.teal + "30",
  },
  empathyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.teal, lineHeight: 21 },

  formGroup: { gap: 10 },
  inputLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: C.textSecondary },

  spendGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  spendChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder,
    alignItems: "center", gap: 4,
  },
  spendChipActive: { borderColor: C.accent, backgroundColor: C.accent + "12" },
  spendEmoji: { fontSize: 18 },
  spendLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textSecondary },
  spendLabelActive: { color: C.accent },

  cameraTips: { gap: 10, backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  cameraTipRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cameraTipText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary },

  selfiePreview: {
    borderRadius: 24, overflow: "hidden",
    aspectRatio: 1, position: "relative",
  },
  selfieImg: { width: "100%", height: "100%" },
  selfieOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end", padding: 16,
    flexDirection: "row", alignItems: "flex-end",
  },
  selfieSuccessRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  selfieSuccessText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  retakeText: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textTertiary },
  selfieButtons: { flexDirection: "row", gap: 12 },

  stepFooter: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
});
