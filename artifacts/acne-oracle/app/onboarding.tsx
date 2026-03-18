import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
  FadeInLeft,
  SlideInRight,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientButton } from "@/components/ui/GradientButton";
import Colors from "@/constants/colors";
import { useApp, type AcneTrigger, type AcneVariant, type SkinTone, type UserProfile } from "@/context/AppContext";

const C = Colors.dark;
const { width } = Dimensions.get("window");

const TOTAL_STEPS = 8;

const SKIN_TONES: { id: SkinTone; label: string; hex: string; subLabel: string }[] = [
  { id: "fair",   label: "Fair",   hex: "#F5D5B5", subLabel: "Very light" },
  { id: "light",  label: "Light",  hex: "#EBBF9A", subLabel: "Light tan" },
  { id: "medium", label: "Medium", hex: "#C8906A", subLabel: "Medium" },
  { id: "olive",  label: "Olive",  hex: "#A07050", subLabel: "Olive" },
  { id: "brown",  label: "Brown",  hex: "#7A4E2D", subLabel: "Brown" },
  { id: "deep",   label: "Deep",   hex: "#3D2010", subLabel: "Deep" },
];

const AGE_OPTIONS = ["18–24", "25–30", "31–35", "36–40", "41+"];

const ACNE_TYPES: { id: AcneVariant; label: string; desc: string }[] = [
  { id: "comedonal",    label: "Blackheads & whiteheads", desc: "Clogged pores, non-inflamed"  },
  { id: "inflammatory", label: "Red, inflamed bumps",      desc: "Papules and pustules"          },
  { id: "cystic",       label: "Deep, painful cysts",      desc: "Large lumps under the skin"   },
  { id: "hormonal",     label: "Hormonal (chin & jaw)",    desc: "Flares with your cycle"        },
  { id: "mixed",        label: "A combination of types",   desc: "Multiple types at once"        },
];

const YEARS_OPTIONS = [
  { label: "1–2 years",  value: 1.5 },
  { label: "3–5 years",  value: 4   },
  { label: "6–10 years", value: 8   },
  { label: "10+ years",  value: 12  },
];

const SPEND_OPTIONS = [
  { label: "Under $100", value: 75,  emoji: "💸" },
  { label: "$100–$300",  value: 200, emoji: "💳" },
  { label: "$300–$600",  value: 450, emoji: "😬" },
  { label: "$600+",      value: 750, emoji: "😱" },
];

const TRIGGER_OPTIONS: { id: AcneTrigger; label: string }[] = [
  { id: "stress",            label: "Stress" },
  { id: "diet",              label: "Diet & food" },
  { id: "hormones",          label: "Hormones & cycle" },
  { id: "sleep",             label: "Sleep" },
  { id: "skincare_products", label: "Skincare products" },
  { id: "not_sure",          label: "Not sure yet" },
];

function ProgressBar({ step }: { step: number }) {
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{step} of {TOTAL_STEPS}</Text>
    </View>
  );
}

function TypingDots() {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    const pulse = (sv: typeof dot1, delay: number) => {
      sv.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 350 }),
          withTiming(0.3, { duration: 350 })
        ),
        -1,
        false
      );
    };
    setTimeout(() => pulse(dot1, 0), 0);
    setTimeout(() => pulse(dot2, 0), 200);
    setTimeout(() => pulse(dot3, 0), 400);
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View style={styles.typingDots}>
      <Animated.View style={[styles.dot, s1]} />
      <Animated.View style={[styles.dot, s2]} />
      <Animated.View style={[styles.dot, s3]} />
    </View>
  );
}

function AiResponseCard({ text }: { text: string }) {
  const words = text.split(" ");
  const [visibleCount, setVisibleCount] = useState(0);
  const [showDots, setShowDots] = useState(true);
  const cursorOpacity = useSharedValue(1);

  useEffect(() => {
    setVisibleCount(0);
    setShowDots(true);

    // Brief "thinking" pause, then start typing
    const startDelay = setTimeout(() => {
      setShowDots(false);
      let idx = 0;
      const timer = setInterval(() => {
        idx += 1;
        setVisibleCount(idx);
        if (idx >= words.length) {
          clearInterval(timer);
          setTimeout(() => { cursorOpacity.value = withTiming(0, { duration: 300 }); }, 800);
        }
      }, 55);
      return () => clearInterval(timer);
    }, 700);

    return () => clearTimeout(startDelay);
  }, [text]);

  const cursorStyle = useAnimatedStyle(() => {
    return { opacity: cursorOpacity.value };
  });

  useEffect(() => {
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 420 }),
        withTiming(1, { duration: 420 })
      ),
      -1,
      true
    );
  }, []);

  const displayedText = words.slice(0, visibleCount).join(" ");

  return (
    <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.aiCard}>
      <Animated.View entering={ZoomIn.delay(120).springify()} style={styles.aiAvatar}>
        <LinearGradient colors={["#FF6B6B", "#FF8E53"]} style={styles.aiAvatarGrad}>
          <Ionicons name="sparkles" size={16} color="#fff" />
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInLeft.delay(180).springify()} style={styles.aiBubble}>
        <Text style={styles.aiName}>AcneOracle</Text>

        {showDots ? (
          <TypingDots />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end" }}>
            <Text style={styles.aiText}>{displayedText}</Text>
            {visibleCount < words.length ? (
              <Animated.Text style={[styles.cursor, cursorStyle]}> |</Animated.Text>
            ) : null}
          </View>
        )}
      </Animated.View>
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const scrollRef = useRef<ScrollView>(null);

  const [step, setStep] = useState(1);
  const [showingResponse, setShowingResponse] = useState(false);

  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState<string | null>(null);
  const [skinTone, setSkinTone] = useState<SkinTone | null>(null);
  const [acneTypes, setAcneTypes] = useState<AcneVariant[]>([]);
  const [yearsWithAcne, setYearsWithAcne] = useState<number | null>(null);
  const [mainFrustration, setMainFrustration] = useState("");
  const [suspectedTriggers, setSuspectedTriggers] = useState<AcneTrigger[]>([]);
  const [currentCream, setCurrentCream] = useState("");
  const [annualSpend, setAnnualSpend] = useState<number | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const topPad = Platform.OS === "web" ? 16 : insets.top;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom;

  const canProceed = (): boolean => {
    if (showingResponse) return true;
    switch (step) {
      case 1: return nickname.trim().length >= 2;
      case 2: return age !== null;
      case 3: return skinTone !== null;
      case 4: return acneTypes.length >= 1;
      case 5: return yearsWithAcne !== null;
      case 6: return suspectedTriggers.length >= 1;
      case 7: return annualSpend !== null;
      case 8: return selfieUri !== null;
      default: return false;
    }
  };

  const getResponseText = (): string => {
    const name = nickname.trim() || "beautiful";
    const spendLabel = SPEND_OPTIONS.find((o) => o.value === annualSpend)?.label ?? "that amount";
    const yearsLabel = YEARS_OPTIONS.find((o) => o.value === yearsWithAcne)?.label ?? "those years";
    switch (step) {
      case 1: return `Hey ${name}, I love that name. I'm here for you every step of the way.`;
      case 2: return `Got it, ${name}. I understand how hormones and life stage can affect your skin – we'll work with exactly where you are right now.`;
      case 3: return `Perfect, ${name}. I'll tailor every single recommendation to your beautiful skin tone so it actually works for you.`;
      case 4: return `I hear you, ${name}. That type can be so frustrating – I've helped many women just like you finally get clear skin.`;
      case 5: return `Wow, ${name}, you've been strong through ${yearsLabel} of this. That frustration is completely valid. I understand how draining it feels. You are so ready for real change.`;
      case 6: return `Thank you for sharing that, ${name}. Knowing your triggers means I can give advice that actually fits your real life – not generic advice.`;
      case 7: return `I see, ${name}. That cream and ${spendLabel} in spending – I promise we'll find smarter, more effective options so you never feel like you're throwing money away again.`;
      case 8: return `Thank you for trusting me with this, ${name}. Your skin is beautiful and we are going to make it glow.`;
      default: return "";
    }
  };

  const advanceStep = () => {
    setShowingResponse(false);
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), 50);
    } else {
      handleComplete();
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!showingResponse && step < TOTAL_STEPS) {
      setShowingResponse(true);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), 50);
    } else if (showingResponse) {
      advanceStep();
    }
  };

  const handleCameraNext = () => {
    if (!selfieUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowingResponse(true);
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), 50);
  };

  const handleBack = () => {
    if (showingResponse) {
      setShowingResponse(false);
      return;
    }
    if (step > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep((s) => s - 1);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: false }), 50);
    }
  };

  const handleComplete = async () => {
    if (!nickname || !age || !skinTone || acneTypes.length === 0 || yearsWithAcne === null || annualSpend === null) return;
    setCompleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const profile: UserProfile = {
      nickname: nickname.trim(),
      age,
      skinTone,
      acneTypes,
      yearsWithAcne,
      mainFrustration,
      suspectedTriggers,
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

    const opts: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      skipProcessing: true,
    };

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);

    if (!result.canceled && result.assets[0]) {
      setSelfieUri(result.assets[0].uri);
      setSelfieBase64(result.assets[0].base64 ?? null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const toggleAcneType = (id: AcneVariant) => {
    Haptics.selectionAsync();
    setAcneTypes((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const toggleTrigger = (id: AcneTrigger) => {
    Haptics.selectionAsync();
    setSuspectedTriggers((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const name = nickname.trim() || "beautiful";

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={[styles.container, { paddingTop: topPad + 12 }]}>

          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={16}>
              <Ionicons name="chevron-back" size={22} color={C.text} />
            </Pressable>
            <ProgressBar step={step} />
          </View>

          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: botPad + 100 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ── AI Response interstitial ── */}
            {showingResponse && (
              <Animated.View entering={FadeIn.springify()} style={styles.responseScreen}>
                <AiResponseCard text={getResponseText()} />
                {step === TOTAL_STEPS && (
                  <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.continueHint}>
                    <Text style={styles.continueHintText}>Tap below to complete your profile</Text>
                  </Animated.View>
                )}
              </Animated.View>
            )}

            {/* ── Step 1: Name ── */}
            {!showingResponse && step === 1 && (
              <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                <Text style={styles.stepHeadline}>Let's make this personal</Text>
                <Text style={styles.stepQuestion}>
                  Hi beautiful, what's your name or a nickname I can use to cheer you on?
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="Your name or nickname..."
                  placeholderTextColor={C.textTertiary}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleNext}
                  maxLength={30}
                />
              </Animated.View>
            )}

            {/* ── Step 2: Age ── */}
            {!showingResponse && step === 2 && (
              <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                <Text style={styles.stepHeadline}>A little about you</Text>
                <Text style={styles.stepQuestion}>How old are you, {name}?</Text>
                <View style={styles.optionList}>
                  {AGE_OPTIONS.map((opt) => {
                    const active = age === opt;
                    return (
                      <Pressable
                        key={opt}
                        style={[styles.optionCard, active && styles.optionCardActive]}
                        onPress={() => { Haptics.selectionAsync(); setAge(opt); }}
                      >
                        <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{opt}</Text>
                        {active && <Ionicons name="checkmark-circle" size={20} color={C.accent} />}
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* ── Step 3: Skin Tone ── */}
            {!showingResponse && step === 3 && (
              <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                <Text style={styles.stepHeadline}>Your unique skin</Text>
                <Text style={styles.stepQuestion}>What best describes your skin tone, {name}?</Text>
                <View style={styles.skinGrid}>
                  {SKIN_TONES.map((t) => {
                    const active = skinTone === t.id;
                    return (
                      <Pressable
                        key={t.id}
                        style={[styles.skinCard, active && styles.skinCardActive]}
                        onPress={() => { Haptics.selectionAsync(); setSkinTone(t.id); }}
                      >
                        <View style={[styles.skinSwatch, { backgroundColor: t.hex }]} />
                        <Text style={[styles.skinLabel, active && styles.skinLabelActive]}>{t.label}</Text>
                        <Text style={styles.skinSub}>{t.subLabel}</Text>
                        {active && (
                          <View style={styles.skinCheck}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* ── Step 4: Acne Type ── */}
            {!showingResponse && step === 4 && (
              <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                <Text style={styles.stepHeadline}>Tell me about your acne</Text>
                <Text style={styles.stepQuestion}>Which types describe your skin, {name}? Select all that apply.</Text>
                <View style={styles.optionList}>
                  {ACNE_TYPES.map((t) => {
                    const active = acneTypes.includes(t.id);
                    return (
                      <Pressable
                        key={t.id}
                        style={[styles.optionCard, active && styles.optionCardActive]}
                        onPress={() => toggleAcneType(t.id)}
                      >
                        <View style={{ flex: 1, gap: 3 }}>
                          <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{t.label}</Text>
                          <Text style={styles.optionDesc}>{t.desc}</Text>
                        </View>
                        {active && <Ionicons name="checkmark-circle" size={20} color={C.accent} />}
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* ── Step 5: Years + Frustration ── */}
            {!showingResponse && step === 5 && (
              <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                <Text style={styles.stepHeadline}>Your real journey</Text>
                <Text style={styles.stepQuestion}>How many years have you been dealing with acne?</Text>
                <View style={styles.optionList}>
                  {YEARS_OPTIONS.map((opt) => {
                    const active = yearsWithAcne === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        style={[styles.optionCard, active && styles.optionCardActive]}
                        onPress={() => { Haptics.selectionAsync(); setYearsWithAcne(opt.value); }}
                      >
                        <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{opt.label}</Text>
                        {active && <Ionicons name="checkmark-circle" size={20} color={C.accent} />}
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={[styles.stepQuestion, { marginTop: 24, fontSize: 16 }]}>
                  What's been the toughest part lately? (optional)
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={mainFrustration}
                  onChangeText={setMainFrustration}
                  placeholder="Tell me what's been hardest for you..."
                  placeholderTextColor={C.textTertiary}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  maxLength={200}
                />
              </Animated.View>
            )}

            {/* ── Step 6: Triggers ── */}
            {!showingResponse && step === 6 && (
              <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                <Text style={styles.stepHeadline}>What might be playing a role</Text>
                <Text style={styles.stepQuestion}>What do you think might be triggering your breakouts, {name}?</Text>
                <View style={styles.optionList}>
                  {TRIGGER_OPTIONS.map((t) => {
                    const active = suspectedTriggers.includes(t.id);
                    return (
                      <Pressable
                        key={t.id}
                        style={[styles.optionCard, active && styles.optionCardActive]}
                        onPress={() => toggleTrigger(t.id)}
                      >
                        <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{t.label}</Text>
                        {active && <Ionicons name="checkmark-circle" size={20} color={C.accent} />}
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* ── Step 7: Cream + Spending ── */}
            {!showingResponse && step === 7 && (
              <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                <Text style={styles.stepHeadline}>Let's stop the waste</Text>
                <Text style={styles.stepQuestion}>
                  What's the main cream or serum you're using right now, {name}? (optional)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={currentCream}
                  onChangeText={setCurrentCream}
                  placeholder="e.g. Benzoyl Peroxide, Differin, CeraVe..."
                  placeholderTextColor={C.textTertiary}
                  returnKeyType="done"
                  maxLength={80}
                />
                <Text style={[styles.stepQuestion, { marginTop: 28, fontSize: 16 }]}>
                  Roughly how much have you spent on skincare in the last 12 months?
                </Text>
                <View style={styles.optionList}>
                  {SPEND_OPTIONS.map((opt) => {
                    const active = annualSpend === opt.value;
                    return (
                      <Pressable
                        key={opt.value}
                        style={[styles.optionCard, active && styles.optionCardActive]}
                        onPress={() => { Haptics.selectionAsync(); setAnnualSpend(opt.value); }}
                      >
                        <Text style={styles.spendEmoji}>{opt.emoji}</Text>
                        <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{opt.label}</Text>
                        {active && <Ionicons name="checkmark-circle" size={20} color={C.accent} />}
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* ── Step 8: Camera ── */}
            {!showingResponse && step === 8 && (
              <Animated.View entering={SlideInRight.springify()} style={styles.stepContent}>
                <Text style={styles.stepHeadline}>Time to meet your skin</Text>
                <Text style={styles.stepQuestion}>
                  Snap a clear selfie so I can run your first AI skin analysis, {name}. I'll be gentle – I promise.
                </Text>

                <View style={styles.cameraTips}>
                  {[
                    { icon: "sunny-outline",        tip: "Natural light works best" },
                    { icon: "person-outline",        tip: "Face forward, fill the frame" },
                    { icon: "eye-off-outline",       tip: "Remove glasses if possible" },
                    { icon: "color-palette-outline", tip: "Works for every skin tone" },
                  ].map((t, i) => (
                    <View key={i} style={styles.cameraTipRow}>
                      <Ionicons name={t.icon as any} size={16} color={C.teal} />
                      <Text style={styles.cameraTipText}>{t.tip}</Text>
                    </View>
                  ))}
                </View>

                {selfieUri ? (
                  <Animated.View entering={ZoomIn.springify()} style={styles.selfiePreview}>
                    <Image source={{ uri: selfieUri }} style={styles.selfieImg} contentFit="cover" />
                    <LinearGradient
                      colors={["transparent", "rgba(0,0,0,0.7)"]}
                      style={styles.selfieOverlay}
                    >
                      <View style={styles.selfieSuccessRow}>
                        <Ionicons name="checkmark-circle" size={22} color={C.success} />
                        <Text style={styles.selfieSuccessText}>Looking great!</Text>
                      </View>
                      <Pressable onPress={() => { setSelfieUri(null); setSelfieBase64(null); }}>
                        <Text style={styles.retakeText}>Retake photo</Text>
                      </Pressable>
                    </LinearGradient>
                  </Animated.View>
                ) : (
                  <View style={styles.selfieButtons}>
                    <GradientButton
                      label="Take Selfie"
                      onPress={() => takeSelfie(true)}
                      style={{ flex: 1 }}
                    />
                    <GradientButton
                      label="Choose Photo"
                      onPress={() => takeSelfie(false)}
                      variant="outline"
                      style={{ flex: 1 }}
                    />
                  </View>
                )}
              </Animated.View>
            )}

          </ScrollView>

          {/* Footer button */}
          <View style={[styles.footer, { paddingBottom: Math.max(botPad, 20) }]}>
            {showingResponse ? (
              step === TOTAL_STEPS ? (
                <GradientButton
                  label={completing ? "Setting up your profile..." : "Complete Onboarding"}
                  onPress={advanceStep}
                  disabled={completing}
                  loading={completing}
                  size="lg"
                />
              ) : (
                <GradientButton
                  label="Continue"
                  onPress={advanceStep}
                  size="lg"
                />
              )
            ) : step === TOTAL_STEPS ? (
              <GradientButton
                label="See My Analysis"
                onPress={handleCameraNext}
                disabled={!selfieUri}
                size="lg"
              />
            ) : (
              <GradientButton
                label="Continue"
                onPress={handleNext}
                disabled={!canProceed()}
                size="lg"
              />
            )}
          </View>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },

  progressWrap: {
    flex: 1,
    gap: 6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: C.backgroundTertiary,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: C.accent,
    borderRadius: 2,
  },
  progressLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: C.textTertiary,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  stepContent: {
    gap: 20,
    paddingBottom: 20,
  },
  stepHeadline: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: C.text,
    lineHeight: 36,
    letterSpacing: -0.3,
    marginTop: 8,
  },
  stepQuestion: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: C.textSecondary,
    lineHeight: 27,
  },

  textInput: {
    backgroundColor: C.inputBg,
    borderWidth: 1.5,
    borderColor: C.inputBorder,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  textArea: {
    minHeight: 90,
    paddingTop: 16,
  },

  optionList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
  },
  optionCardActive: {
    borderColor: C.accent,
    backgroundColor: C.accent + "10",
  },
  optionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: C.textSecondary,
    flex: 1,
  },
  optionLabelActive: {
    color: C.text,
    fontFamily: "Inter_600SemiBold",
  },
  optionDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textTertiary,
  },

  spendEmoji: {
    fontSize: 20,
  },

  skinGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  skinCard: {
    width: (width - 48 - 10) / 2,
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    gap: 8,
    position: "relative",
  },
  skinCardActive: {
    borderColor: C.accent,
    backgroundColor: C.accent + "10",
  },
  skinSwatch: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  skinLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: C.text,
  },
  skinLabelActive: {
    color: C.accent,
  },
  skinSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: C.textTertiary,
  },
  skinCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.accent,
    justifyContent: "center",
    alignItems: "center",
  },

  cameraTips: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 14,
  },
  cameraTipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cameraTipText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textSecondary,
  },
  selfiePreview: {
    borderRadius: 24,
    overflow: "hidden",
    aspectRatio: 1,
    position: "relative",
  },
  selfieImg: {
    width: "100%",
    height: "100%",
  },
  selfieOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  selfieSuccessRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selfieSuccessText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
  retakeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  selfieButtons: {
    flexDirection: "row",
    gap: 12,
  },

  // Response screen
  responseScreen: {
    flex: 1,
    paddingTop: 40,
    paddingBottom: 20,
    gap: 24,
  },
  aiCard: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  aiAvatar: {
    marginTop: 2,
  },
  aiAvatarGrad: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  aiBubble: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 20,
    borderTopLeftRadius: 6,
    padding: 20,
    borderWidth: 1,
    borderColor: C.accent + "35",
    gap: 8,
  },
  aiName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: C.accent,
  },
  aiText: {
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    color: C.text,
    lineHeight: 28,
  },
  cursor: {
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: C.accent,
    lineHeight: 28,
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.accent,
  },
  continueHint: {
    alignItems: "center",
    marginTop: 12,
  },
  continueHintText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: C.textTertiary,
  },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: C.separator,
    backgroundColor: C.background,
  },
});
