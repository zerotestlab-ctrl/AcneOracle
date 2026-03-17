import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { fetch } from "expo/fetch";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GradientButton } from "@/components/ui/GradientButton";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import Colors from "@/constants/colors";
import { useApp, type AcneType, type AnalysisResult, type SeverityLevel } from "@/context/AppContext";

const C = Colors.dark;
const { width } = Dimensions.get("window");
const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, addAnalysis } = useApp();
  const { selfieBase64, selfieUri } = useLocalSearchParams<{ selfieBase64: string; selfieUri: string }>();

  const [welcomeText, setWelcomeText] = useState("");
  const [welcomeDone, setWelcomeDone] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);

  const topPad = Platform.OS === "web" ? 16 : insets.top;
  const botPad = Platform.OS === "web" ? 24 : insets.bottom;

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current || !userProfile) return;
    hasFetched.current = true;
    fetchWelcomeMessage();
  }, [userProfile]);

  const fetchWelcomeMessage = async () => {
    if (!userProfile) return;
    try {
      const response = await fetch(`${BASE_URL}/acne/welcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userProfile }),
      });
      if (!response.ok || !response.body) {
        setWelcomeText(`Hey ${userProfile.nickname}! I'm so glad you're here. Let's get your skin the attention it deserves.`);
        setWelcomeDone(true);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) { full += data.content; setWelcomeText(full); }
              if (data.done) break;
            } catch {}
          }
        }
      }
      setWelcomeDone(true);
      if (selfieBase64 || selfieUri) {
        setTimeout(() => runAnalysis(full), 600);
      }
    } catch {
      const fallback = `Hey ${userProfile?.nickname ?? "friend"}! You've taken the first step, and that alone matters. Let's work on this together. 💙`;
      setWelcomeText(fallback);
      setWelcomeDone(true);
      if (selfieBase64 || selfieUri) setTimeout(() => runAnalysis(fallback), 600);
    }
  };

  const runAnalysis = async (_welcomeMsg: string) => {
    if (!selfieUri && !selfieBase64) return;
    setAnalyzing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let base64 = selfieBase64 ?? "";
      if (!base64 && selfieUri) {
        if (Platform.OS !== "web") {
          base64 = await FileSystem.readAsStringAsync(selfieUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }
      }
      if (!base64) { setAnalyzing(false); return; }

      const resp = await fetch(`${BASE_URL}/acne/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, userProfile }),
      });
      if (!resp.ok) throw new Error("Analysis failed");
      const data = await resp.json();

      const analysis: AnalysisResult = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        date: new Date().toISOString(),
        imageUri: selfieUri ?? "",
        acneType: (data.acneType as AcneType) || "unknown",
        severity: Math.max(1, Math.min(5, parseInt(data.severity) || 1)) as SeverityLevel,
        description: data.description || "",
        recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
        triggerProducts: Array.isArray(data.triggerProducts) ? data.triggerProducts : [],
        alternativeProducts: Array.isArray(data.alternativeProducts) ? data.alternativeProducts : [],
        routine: Array.isArray(data.routine) ? data.routine : [],
        personalizedInsight: data.personalizedInsight ?? "",
        spendingCritique: data.spendingCritique ?? "",
      };

      await addAnalysis(analysis);
      setAnalysisResult(analysis);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setAnalyzing(false);
      setAnalysisDone(true);
    }
  };

  const goHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <LinearGradient
        colors={["#FF6B6B08", "#00C9A705", C.background]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 20, paddingBottom: botPad + 40, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + name */}
        <Animated.View entering={ZoomIn.delay(100).springify()} style={styles.avatarRow}>
          <LinearGradient colors={C.accentGradient} style={styles.avatar}>
            <Ionicons name="sparkles" size={28} color="#fff" />
          </LinearGradient>
          <View>
            <Text style={styles.avatarLabel}>AcneOracle AI</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Just for you</Text>
            </View>
          </View>
        </Animated.View>

        {/* Welcome message */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.welcomeCard}>
          {welcomeText.length === 0 ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={C.teal} size="small" />
              <Text style={styles.loadingText}>Writing your personal message...</Text>
            </View>
          ) : (
            <Text style={styles.welcomeText}>{welcomeText}</Text>
          )}
        </Animated.View>

        {/* Selfie preview */}
        {selfieUri && (
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.selfieCard}>
            <Image source={{ uri: selfieUri }} style={styles.selfieImg} contentFit="cover" />
            {analyzing && (
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator size="large" color={C.accent} />
                <Text style={styles.analyzingText}>Running full skin analysis...</Text>
              </View>
            )}
          </Animated.View>
        )}

        {/* Analysis result */}
        {analysisResult && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.analysisCard}>
            <View style={styles.analysisHeader}>
              <Ionicons name="checkmark-circle" size={22} color={C.success} />
              <Text style={styles.analysisHeaderText}>Your First Analysis</Text>
            </View>

            <SeverityBadge severity={analysisResult.severity} acneType={analysisResult.acneType} />

            {analysisResult.personalizedInsight ? (
              <View style={styles.insightCard}>
                <Ionicons name="sparkles" size={16} color={C.accent} />
                <Text style={styles.insightText}>{analysisResult.personalizedInsight}</Text>
              </View>
            ) : null}

            {analysisResult.spendingCritique ? (
              <View style={styles.spendCard}>
                <Ionicons name="wallet-outline" size={16} color="#FF8E53" />
                <Text style={styles.spendCritiqueText}>{analysisResult.spendingCritique}</Text>
              </View>
            ) : null}

            <Text style={styles.analysisDesc}>{analysisResult.description}</Text>

            {analysisResult.recommendations.length > 0 && (
              <View style={styles.recSection}>
                <Text style={styles.recTitle}>Top Recommendations for You</Text>
                {analysisResult.recommendations.slice(0, 3).map((r, i) => (
                  <View key={i} style={styles.recRow}>
                    <View style={styles.recNumBadge}>
                      <Text style={styles.recNum}>{i + 1}</Text>
                    </View>
                    <Text style={styles.recText}>{r}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.disclaimer}>
              <Ionicons name="shield-checkmark-outline" size={13} color={C.textTertiary} />
              <Text style={styles.disclaimerText}>
                This is AI wellness advice only – not a doctor. Consult a dermatologist for medical decisions.
              </Text>
            </View>
          </Animated.View>
        )}

        {/* No selfie fallback */}
        {!selfieUri && welcomeDone && !analyzing && (
          <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.noSelfieCard}>
            <Ionicons name="scan-outline" size={32} color={C.textTertiary} />
            <Text style={styles.noSelfieTitle}>Ready for your first scan?</Text>
            <Text style={styles.noSelfieText}>Head to the home screen and tap "Scan Now" to get your full AI analysis.</Text>
          </Animated.View>
        )}

        {/* CTA */}
        {welcomeDone && !analyzing && (
          <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.cta}>
            <GradientButton
              label={`Let's do this, ${userProfile?.nickname ?? "friend"}! 💪`}
              onPress={goHome}
              size="lg"
            />
            <Text style={styles.ctaSubText}>Your personalised dashboard is ready</Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  avatar: { width: 52, height: 52, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  avatarLabel: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.text },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.teal },
  onlineText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.teal },
  welcomeCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: C.cardBorder, marginBottom: 16,
  },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary },
  welcomeText: { fontFamily: "Inter_400Regular", fontSize: 16, color: C.text, lineHeight: 26 },
  selfieCard: {
    borderRadius: 24, overflow: "hidden", aspectRatio: 1,
    marginBottom: 16, position: "relative",
  },
  selfieImg: { width: "100%", height: "100%" },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,11,16,0.75)",
    justifyContent: "center", alignItems: "center", gap: 12,
  },
  analyzingText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
  analysisCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: C.success + "40", marginBottom: 16, gap: 14,
  },
  analysisHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  analysisHeaderText: { fontFamily: "Inter_700Bold", fontSize: 17, color: C.text },
  insightCard: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: C.accent + "12", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.accent + "30",
  },
  insightText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.text, flex: 1, lineHeight: 21 },
  spendCard: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: "#FF8E5312", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#FF8E5330",
  },
  spendCritiqueText: {
    fontFamily: "Inter_400Regular", fontSize: 14, color: "#FF8E53", flex: 1, lineHeight: 21,
  },
  analysisDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, lineHeight: 21 },
  recSection: { gap: 10 },
  recTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text },
  recRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  recNumBadge: {
    width: 22, height: 22, borderRadius: 7, backgroundColor: C.accent + "22",
    justifyContent: "center", alignItems: "center",
  },
  recNum: { fontFamily: "Inter_700Bold", fontSize: 11, color: C.accent },
  recText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, flex: 1, lineHeight: 20 },
  disclaimer: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  disclaimerText: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary, flex: 1, lineHeight: 17 },
  noSelfieCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 28, alignItems: "center", gap: 10,
    borderWidth: 1, borderColor: C.cardBorder, marginBottom: 16,
  },
  noSelfieTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: C.textSecondary },
  noSelfieText: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textTertiary, textAlign: "center", lineHeight: 21 },
  cta: { gap: 10 },
  ctaSubText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textTertiary, textAlign: "center" },
});
