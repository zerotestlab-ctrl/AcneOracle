import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as FileSystem from "expo-file-system";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";

import Colors from "@/constants/colors";
import { useApp, type AnalysisResult, type AcneType, type SeverityLevel } from "@/context/AppContext";
import { GradientButton } from "@/components/ui/GradientButton";
import { SeverityBadge } from "@/components/ui/SeverityBadge";

const C = Colors.dark;
const { width, height } = Dimensions.get("window");
const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

const TIPS = [
  { icon: "sunny", text: "Natural light or bright indoor light works best" },
  { icon: "person", text: "Face the camera directly, fill the frame with your face" },
  { icon: "eye-off", text: "Remove glasses or obstructions" },
  { icon: "color-palette", text: "Works for all skin tones — no filter needed" },
];

export default function CameraScreen() {
  const insets = useSafeAreaInsets();
  const { addAnalysis } = useApp();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const pickImage = async (fromCamera: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Camera Permission", "Camera access is needed to take skin selfies.");
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Photos Permission", "Photo library access is needed.");
        return;
      }
    }

    const result = await (fromCamera
      ? ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        })
      : ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        }));

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setResult(null);
    }
  };

  const analyze = async () => {
    if (!imageUri) return;
    setAnalyzing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      let base64 = "";
      if (Platform.OS !== "web") {
        base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(blob);
        });
      }

      const apiResponse = await fetch(`${BASE_URL}/acne/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!apiResponse.ok) throw new Error("Analysis failed");

      const data = await apiResponse.json();

      const analysis: AnalysisResult = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
        date: new Date().toISOString(),
        imageUri,
        acneType: (data.acneType as AcneType) || "unknown",
        severity: Math.max(1, Math.min(5, parseInt(data.severity) || 1)) as SeverityLevel,
        description: data.description || "",
        recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
        triggerProducts: Array.isArray(data.triggerProducts) ? data.triggerProducts : [],
        alternativeProducts: Array.isArray(data.alternativeProducts) ? data.alternativeProducts : [],
        routine: Array.isArray(data.routine) ? data.routine : [],
      };

      await addAnalysis(analysis);
      setResult(analysis);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("Analysis error:", err);
      Alert.alert("Analysis Failed", "Please check your connection and try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const ACNE_TYPE_NAMES: Record<string, string> = {
    comedonal: "Comedonal",
    inflammatory: "Inflammatory",
    cystic: "Cystic",
    hormonal: "Hormonal",
    mixed: "Mixed",
    unknown: "Unknown",
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <Pressable
        style={[styles.closeBtn, { top: topPad + 8 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={22} color={C.text} />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPad + 60, paddingBottom: botPad + 40 }}
      >
        {!imageUri ? (
          <Animated.View entering={FadeInDown.springify()} style={styles.intro}>
            <LinearGradient
              colors={["#FF6B6B22", "#FF8E5308"]}
              style={styles.introGrad}
            >
              <View style={styles.scanCircle}>
                <LinearGradient colors={C.accentGradient} style={styles.scanCircleGrad}>
                  <Ionicons name="scan" size={48} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.introTitle}>Skin Analysis</Text>
              <Text style={styles.introSub}>
                Take or upload a clear, well-lit photo of your face to get your personalized AI acne analysis
              </Text>
            </LinearGradient>

            <View style={styles.tipsBox}>
              <Text style={styles.tipsTitle}>Tips for best results</Text>
              {TIPS.map((t, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons name={t.icon as any} size={16} color={C.teal} />
                  <Text style={styles.tipRowText}>{t.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.btnGroup}>
              <GradientButton
                label="Take Photo"
                onPress={() => pickImage(true)}
                style={{ flex: 1 }}
              />
              <GradientButton
                label="Choose Photo"
                onPress={() => pickImage(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
            </View>

            <View style={styles.disclaimer}>
              <Ionicons name="shield-checkmark-outline" size={14} color={C.textTertiary} />
              <Text style={styles.disclaimerText}>
                AcneOracle is a wellness coach, not a medical doctor. For skin conditions, consult a dermatologist.
              </Text>
            </View>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.springify()} style={styles.analysisView}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
              {!analyzing && !result && (
                <Pressable
                  style={styles.retakeBtn}
                  onPress={() => { setImageUri(null); setResult(null); }}
                >
                  <Ionicons name="refresh" size={18} color="#fff" />
                </Pressable>
              )}
            </View>

            {analyzing && (
              <Animated.View entering={ZoomIn.springify()} style={styles.analyzingCard}>
                <ActivityIndicator size="large" color={C.accent} />
                <Text style={styles.analyzingText}>Analyzing your skin...</Text>
                <Text style={styles.analyzingSubtext}>Our AI is detecting acne type, severity, and triggers</Text>
              </Animated.View>
            )}

            {result && !analyzing && (
              <Animated.View entering={FadeInDown.springify()} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Ionicons name="checkmark-circle" size={24} color={C.success} />
                  <Text style={styles.resultTitle}>Analysis Complete</Text>
                </View>

                <SeverityBadge severity={result.severity} acneType={result.acneType} />

                <Text style={styles.resultDesc}>{result.description}</Text>

                {result.recommendations.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recommendations</Text>
                    {result.recommendations.slice(0, 3).map((r, i) => (
                      <View key={i} style={styles.recRow}>
                        <View style={styles.recDot} />
                        <Text style={styles.recText}>{r}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {result.alternativeProducts.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recommended Products</Text>
                    {result.alternativeProducts.slice(0, 3).map((p, i) => (
                      <View key={i} style={styles.productRow}>
                        <Ionicons name="flask" size={14} color={C.teal} />
                        <Text style={styles.productText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.resultActions}>
                  <GradientButton
                    label="View Full Results"
                    onPress={() => { router.back(); router.push("/results"); }}
                    style={{ flex: 1 }}
                  />
                  <Pressable
                    style={styles.scanAgainBtn}
                    onPress={() => { setImageUri(null); setResult(null); }}
                  >
                    <Ionicons name="refresh" size={18} color={C.textSecondary} />
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {!analyzing && !result && (
              <GradientButton
                label="Analyze My Skin"
                onPress={analyze}
                style={{ marginHorizontal: 16 }}
                size="lg"
              />
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  closeBtn: {
    position: "absolute",
    left: 20,
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card,
    justifyContent: "center", alignItems: "center",
    zIndex: 10,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  intro: { paddingHorizontal: 16, gap: 16 },
  introGrad: {
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: C.accent + "28",
  },
  scanCircle: { marginBottom: 8 },
  scanCircleGrad: {
    width: 100, height: 100, borderRadius: 30,
    justifyContent: "center", alignItems: "center",
  },
  introTitle: { fontFamily: "Inter_700Bold", fontSize: 26, color: C.text },
  introSub: { fontFamily: "Inter_400Regular", fontSize: 15, color: C.textSecondary, textAlign: "center", lineHeight: 22 },
  tipsBox: {
    backgroundColor: C.card, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: C.cardBorder, gap: 12,
  },
  tipsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text, marginBottom: 4 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tipRowText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, flex: 1 },
  btnGroup: { flexDirection: "row", gap: 10 },
  disclaimer: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  disclaimerText: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary, flex: 1, lineHeight: 18 },
  analysisView: { paddingHorizontal: 16, gap: 16 },
  imageContainer: { position: "relative" },
  previewImage: { width: "100%", height: width - 32, borderRadius: 24 },
  retakeBtn: {
    position: "absolute", top: 12, right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 36, height: 36, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  analyzingCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 28,
    alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  analyzingText: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: C.text },
  analyzingSubtext: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, textAlign: "center" },
  resultCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 20,
    gap: 14, borderWidth: 1, borderColor: C.success + "40",
  },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  resultTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.text },
  resultDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, lineHeight: 21 },
  section: { gap: 8 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text },
  recRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  recDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accent, marginTop: 7 },
  recText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, flex: 1, lineHeight: 20 },
  productRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  productText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, flex: 1 },
  resultActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  scanAgainBtn: {
    width: 50, height: 54, borderRadius: 16,
    backgroundColor: C.backgroundTertiary,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: C.separator,
  },
});
