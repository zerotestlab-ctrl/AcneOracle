import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

import Colors from "@/constants/colors";
import { useApp, type SkincareProduct } from "@/context/AppContext";
import { GradientButton } from "@/components/ui/GradientButton";

const C = Colors.dark;

const CATEGORIES = ["Cleanser", "Moisturizer", "Serum", "SPF", "Treatment", "Toner", "Mask", "Other"];

function ProductCard({ product, onDelete }: { product: SkincareProduct; onDelete: () => void }) {
  return (
    <Animated.View entering={FadeInRight.springify()}>
      <Pressable
        style={({ pressed }) => [styles.productCard, { opacity: pressed ? 0.8 : 1 }]}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Alert.alert("Remove Product", `Remove "${product.name}"?`, [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: onDelete },
          ]);
        }}
      >
        <View style={styles.productLeft}>
          <View style={styles.productIcon}>
            <Ionicons name="flask" size={18} color={C.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
            <View style={styles.productMeta}>
              <Text style={styles.productBrand}>{product.brand}</Text>
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{product.category}</Text>
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.productCost}>${product.cost.toFixed(2)}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function LogScreen() {
  const insets = useSafeAreaInsets();
  const { products, addProduct, removeProduct, monthlySpend } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [cost, setCost] = useState("");
  const [category, setCategory] = useState("Cleanser");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleAdd = async () => {
    if (!name.trim()) return;
    const costNum = parseFloat(cost) || 0;
    await addProduct({ name: name.trim(), brand: brand.trim() || "Unknown", cost: costNum, category });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName(""); setBrand(""); setCost(""); setCategory("Cleanser");
    setShowModal(false);
  };

  const spendBudget = 80;
  const spendPercent = Math.min(1, monthlySpend / spendBudget);

  return (
    <View style={[styles.root, { backgroundColor: C.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.title}>Product Log</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowModal(true);
          }}
        >
          <LinearGradient colors={C.accentGradient} style={styles.addBtnGrad}>
            <Ionicons name="add" size={22} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      <Animated.View entering={FadeInDown.delay(50).springify()} style={styles.spendCard}>
        <View style={styles.spendRow}>
          <View>
            <Text style={styles.spendLabel}>Monthly Spend</Text>
            <Text style={styles.spendValue}>${monthlySpend.toFixed(2)}</Text>
          </View>
          <View style={styles.spendRight}>
            <Text style={styles.spendBudgetLabel}>Budget: ${spendBudget}</Text>
            <Text style={[styles.spendStatus, { color: spendPercent > 0.9 ? C.error : C.success }]}>
              {spendPercent > 0.9 ? "Over budget" : "On track"}
            </Text>
          </View>
        </View>
        <View style={styles.progressBg}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: `${spendPercent * 100}%` as any,
                backgroundColor: spendPercent > 0.9 ? C.error : C.accent,
              },
            ]}
          />
        </View>
        <Text style={styles.spendCount}>{products.length} products tracked</Text>
      </Animated.View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <ProductCard product={item} onDelete={() => removeProduct(item.id)} />
        )}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: botPad + 100,
          gap: 10,
          paddingTop: 4,
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="flask-outline" size={48} color={C.textTertiary} />
            <Text style={styles.emptyTitle}>No products yet</Text>
            <Text style={styles.emptySub}>Track your skincare spending to get AI-powered cost vs. results insights</Text>
          </View>
        }
      />

      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Product</Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={C.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Product Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="CeraVe Hydrating Cleanser"
                placeholderTextColor={C.textTertiary}
                autoFocus
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Brand</Text>
              <TextInput
                style={styles.input}
                value={brand}
                onChangeText={setBrand}
                placeholder="CeraVe"
                placeholderTextColor={C.textTertiary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Monthly Cost ($)</Text>
              <TextInput
                style={styles.input}
                value={cost}
                onChangeText={setCost}
                placeholder="15.99"
                placeholderTextColor={C.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.catRow}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.catChip,
                      category === cat && styles.catChipActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setCategory(cat);
                    }}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        category === cat && styles.catChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <GradientButton
              label="Add Product"
              onPress={handleAdd}
              disabled={!name.trim()}
              style={{ marginTop: 8 }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: C.text },
  addBtn: { borderRadius: 14, overflow: "hidden" },
  addBtnGrad: { width: 44, height: 44, justifyContent: "center", alignItems: "center", borderRadius: 14 },
  spendCard: {
    marginHorizontal: 16,
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 16,
  },
  spendRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  spendLabel: { fontFamily: "Inter_400Regular", fontSize: 13, color: C.textSecondary, marginBottom: 4 },
  spendValue: { fontFamily: "Inter_700Bold", fontSize: 30, color: C.text },
  spendRight: { alignItems: "flex-end" },
  spendBudgetLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary },
  spendStatus: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginTop: 4 },
  progressBg: { height: 6, backgroundColor: C.backgroundTertiary, borderRadius: 3, overflow: "hidden", marginBottom: 10 },
  progressFill: { height: "100%", borderRadius: 3 },
  spendCount: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textTertiary },
  productCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  productLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 12 },
  productIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: C.accent + "18",
    justifyContent: "center", alignItems: "center",
  },
  productName: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: C.text, marginBottom: 4 },
  productMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  productBrand: { fontFamily: "Inter_400Regular", fontSize: 12, color: C.textSecondary },
  catBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
    backgroundColor: C.teal + "22",
  },
  catBadgeText: { fontFamily: "Inter_500Medium", fontSize: 10, color: C.teal },
  productCost: { fontFamily: "Inter_700Bold", fontSize: 16, color: C.accent },
  empty: { alignItems: "center", paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: C.textSecondary },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, color: C.textTertiary, textAlign: "center", lineHeight: 20 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" },
  modalSheet: {
    backgroundColor: C.backgroundSecondary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  modalHandle: { width: 36, height: 4, backgroundColor: C.separator, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 20, color: C.text },
  formGroup: { marginBottom: 16 },
  formLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: C.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.text,
  },
  catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 10, borderWidth: 1, borderColor: C.separator,
    backgroundColor: C.card,
  },
  catChipActive: { borderColor: C.accent, backgroundColor: C.accent + "18" },
  catChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: C.textSecondary },
  catChipTextActive: { color: C.accent },
});
