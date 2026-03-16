import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import Colors from "@/constants/colors";
import { useApp, type AnalysisResult } from "@/context/AppContext";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { GradientButton } from "@/components/ui/GradientButton";

const C = Colors.dark;
const { width } = Dimensions.get("window");
const BASE_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

function HistoryItem({ analysis, onPress }: { analysis: AnalysisResult; onPress: () => void }) {
  const SEVERITY_COLORS = [C.severity1, C.severity2, C.severity3, C.severity4, C.severity5];
  const color = SEVERITY_COLORS[Math.max(0, analysis.severity - 1)];

  return (
    <Pressable
      style={({ pressed }) => [styles.histItem, { opacity: pressed ? 0.8 : 1 }]}
      onPress={onPress}
    >
      {analysis.imageUri ? (
        <Image source={{ uri: analysis.imageUri }} style={styles.histImg} contentFit="cover" />
      ) : (
        <View style={[styles.histImg, styles.histImgPlaceholder]}>
          <Ionicons name="person-circle" size={28} color={C.textTertiary} />
        </View>
      )}
      <View style={styles.histInfo}>
        <Text style={styles.histDate}>
          {new Date(analysis.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </Text>
        <SeverityBadge severity={analysis.severity} acneType={analysis.acneType} />
      </View>
      <View style={[styles.histSeverity, { backgroundColor: color + "22" }]}>
        <Text style={[styles.histSeverityText, { color }]}>{analysis.severity}</Text>
      </View>
    </Pressable>
  );
}

function DetailView({ analysis, onSimulate, simLoading, simImage }: {
  analysis: AnalysisResult;
  onSimulate: (weeks: number) => void;
  simLoading: boolean;
  simImage: string | null;
}) {
  const ACNE_TYPE_NAMES: Record<string, string> = {
    comedonal: "Comedonal", inflammatory: "Inflammatory", cystic: "Cystic",
    hormonal: "Hormonal", mixed: "Mixed", unknown: "Unknown",
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      <View style={styles.detailContent}>
        {analysis.imageUri && (
          <Image source={{ uri: analysis.imageUri }} style={styles.detailImage} contentFit="cover" />
        )}

        <View style={styles.detailCard}>
          <Text style={styles.detailDate}>
            {new Date(analysis.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </Text>
          <SeverityBadge severity={analysis.severity} acneType={analysis.acneType} />
          <Text style={styles.detailDesc}>{analysis.description}</Text>
        </View>

        {analysis.recommendations.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Recommendations</Text>
            {analysis.recommendations.map((r, i) => (
              <View key={i} style={styles.recCard}>
                <View style={styles.recNum}>
                  <Text style={styles.recNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.recText}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {analysis.triggerProducts.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Potential Triggers</Text>
            <View style={styles.tagGroup}>
              {analysis.triggerProducts.map((p, i) => (
                <View key={i} style={[styles.tag, { backgroundColor: C.error + "18", borderColor: C.error + "44" }]}>
                  <Ionicons name="close-circle" size={12} color={C.error} />
                  <Text style={[styles.tagText, { color: C.error }]}>{p}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {analysis.alternativeProducts.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Recommended Products</Text>
            {analysis.alternativeProducts.map((p, i) => (
              <View key={i} style={styles.productRec}>
                <Ionicons name="flask" size={16} color={C.teal} />
                <Text style={styles.productRecText}>{p}</Text>
              </View>
            ))}
          </View>
        )}

        {analysis.routine.length > 0 && (
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Your Routine</Text>
            {analysis.routine.map((step, i) => (
              <View key={i} style={styles.routineStep}>
                <LinearGradient colors={C.tealGradient} style={styles.routineNum}>
                  <Text style={styles.routineNumText}>{i + 1}</Text>
                </LinearGradient>
                <Text style={styles.routineText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.detailSection}>
          <Text style={styles.detailSectionTitle}>AI Before/After Simulation</Text>
          <Text style={styles.simSubtext}>See how your skin could look with consistent care</Text>

          {simImage ? (
            <View style={styles.simResult}>
              <Text style={styles.simLabel}>Simulated 8-Week Result</Text>
              <Image
                source={{ uri: `data:image/png;base64,${simImage}` }}
                style={styles.simImage}
                contentFit="cover"
              />
              <Text style={styles.simDisclaimer}>This is an AI simulation for motivation only, not a medical prediction.</Text>
            </View>
          ) : (
            <View style={styles.simButtons}>
              {simLoading ? (
                <View style={styles.simLoading}>
                  <ActivityIndicator color={C.accent} />
                  <Text style={styles.simLoadingText}>Generating your simulation...</Text>
                </View>
              ) : (
                <>
                  <GradientButton label="4-Week Preview" onPress={() => onSimulate(4)} variant="outline" size="sm" style={{ flex: 1 }} />
                  <GradientButton label="8-Week Preview" onPress={() => onSimulate(8)} size="sm" style={{ flex: 1 }} />
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

export default function ResultsScreen() {
  const insets = useSafeAreaInsets();
  const { analyses } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(analyses[0]?.id ?? null);
  const [simLoading, setSimLoading] = useState(false);
  const [simImage, setSimImage] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const selected = analyses.find((a) => a.id === selectedId) ?? null;

  const handleSimulate = async (weeks: number) => {
    if (!selected?.imageUri) return;
    setSimLoading(true);
    try {
      const imgResponse = await fetch(selected.imageUri);
      const blob = await imgResponse.blob();
      let base64 = "";
      if (Platform.OS === "web") {
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(blob);
        });
      } else {
        const { readAsStringAsync, EncodingType } = await import("expo-file-system");
        base64 = await readAsStringAsync(selected.imageUri, { encoding: EncodingType.Base64 });
      }

      const resp = await fetch(`${BASE_URL}/acne/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, weeks }),
      });
      const data = await resp.json();
      setSimImage(data.simulatedImage || null);
    } catch {
      // ignore
    } finally {
      setSimLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-down" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Analyses</Text>
        <View style={{ width: 40 }} />
      </View>

      {analyses.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="scan-outline" size={56} color={C.textTertiary} />
          <Text style={styles.emptyTitle}>No analyses yet</Text>
          <Text style={styles.emptySub}>Take your first skin scan to see results here</Text>
          <GradientButton label="Scan My Skin" onPress={() => { router.back(); router.push("/camera"); }} style={{ marginTop: 8 }} />
        </View>
      ) : (
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View style={styles.sidebar}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad + 20, gap: 8, padding: 8 }}>
              {analyses.map((a) => (
                <HistoryItem
                  key={a.id}
                  analysis={a}
                  onPress={() => { setSelectedId(a.id); setSimImage(null); }}
                />
              ))}
            </ScrollView>
          </View>

          {selected && (
            <View style={[styles.detail, { paddingBottom: botPad }]}>
              <DetailView
                analysis={selected}
                onSimulate={handleSimulate}
                simLoading={simLoading}
                simImage={simImage}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: C.card, justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: C.text },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 20, color: C.textSecondary },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textTertiary, textAlign: "center" },
  sidebar: { width: 90, borderRightWidth: 1, borderRightColor: C.separator },
  histItem: {
    backgroundColor: C.card, borderRadius: 12, padding: 8, gap: 6,
    borderWidth: 1, borderColor: C.cardBorder, alignItems: "center",
  },
  histImg: { width: 58, height: 58, borderRadius: 10 },
  histImgPlaceholder: { backgroundColor: C.backgroundTertiary, justifyContent: "center", alignItems: "center" },
  histInfo: { alignItems: "center", gap: 4 },
  histDate: { fontFamily: "Inter_400Regular", fontSize: 9, color: C.textTertiary, textAlign: "center" },
  histSeverity: { width: 22, height: 22, borderRadius: 6, justifyContent: "center", alignItems: "center" },
  histSeverityText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  detail: { flex: 1 },
  detailContent: { padding: 16, gap: 16, paddingBottom: 40 },
  detailImage: { width: "100%", height: 200, borderRadius: 20 },
  detailCard: {
    backgroundColor: C.card, borderRadius: 20, padding: 16, gap: 10,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  detailDate: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textSecondary },
  detailDesc: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textSecondary, lineHeight: 21 },
  detailSection: { gap: 10 },
  detailSectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.text },
  recCard: {
    flexDirection: "row", gap: 12, backgroundColor: C.card,
    borderRadius: 14, padding: 12, alignItems: "flex-start",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  recNum: {
    width: 24, height: 24, borderRadius: 8, backgroundColor: C.accent + "22",
    justifyContent: "center", alignItems: "center",
  },
  recNumText: { fontFamily: "Inter_700Bold", fontSize: 12, color: C.accent },
  recText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, flex: 1, lineHeight: 20 },
  tagGroup: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
  },
  tagText: { fontFamily: "Inter_500Medium", fontSize: 12 },
  productRec: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  productRecText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, flex: 1 },
  routineStep: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  routineNum: { width: 24, height: 24, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  routineNumText: { fontFamily: "Inter_700Bold", fontSize: 11, color: "#fff" },
  routineText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, flex: 1, lineHeight: 20, paddingTop: 3 },
  simSubtext: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, marginBottom: 4 },
  simButtons: { flexDirection: "row", gap: 10 },
  simLoading: {
    backgroundColor: C.card, borderRadius: 16, padding: 24,
    alignItems: "center", gap: 10, borderWidth: 1, borderColor: C.cardBorder,
  },
  simLoadingText: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary },
  simResult: { gap: 10 },
  simLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text },
  simImage: { width: "100%", height: 200, borderRadius: 16 },
  simDisclaimer: { fontFamily: "Inter_400Regular", fontSize: 11, color: C.textTertiary, lineHeight: 16 },
});
