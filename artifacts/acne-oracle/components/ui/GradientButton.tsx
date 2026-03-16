import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";

import Colors from "@/constants/colors";

const C = Colors.dark;

interface GradientButtonProps {
  onPress: () => void;
  label: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: "primary" | "teal" | "outline";
  size?: "sm" | "md" | "lg";
}

export function GradientButton({
  onPress,
  label,
  loading,
  disabled,
  style,
  variant = "primary",
  size = "md",
}: GradientButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const heights = { sm: 44, md: 54, lg: 62 };
  const fontSizes = { sm: 14, md: 16, lg: 18 };

  if (variant === "outline") {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.outline,
          { height: heights[size], opacity: pressed || disabled ? 0.6 : 1 },
          style,
        ]}
      >
        <Text style={[styles.outlineText, { fontSize: fontSizes[size] }]}>
          {loading ? "..." : label}
        </Text>
      </Pressable>
    );
  }

  const gradientColors =
    variant === "teal"
      ? C.tealGradient
      : C.accentGradient;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed || disabled ? 0.7 : 1 },
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, { height: heights[size] }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[styles.label, { fontSize: fontSizes[size] }]}>
            {label}
          </Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
  },
  gradient: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  label: {
    color: "#fff",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  outline: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.accent,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  outlineText: {
    color: C.accent,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
