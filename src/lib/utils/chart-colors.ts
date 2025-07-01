"use client";

/**
 * A collection of predefined chart colors
 */
export const CHART_COLORS = {
  primary: "#8884d8", // Blue
  success: "#82ca9d", // Green
  warning: "#ffc658", // Yellow
  danger: "#ff7300", // Orange
  neutral: "#888888", // Gray
  purple: "#8a2be2", // Purple
  red: "#d32f2f", // Red
  teal: "#009688", // Teal
  pink: "#e91e63", // Pink
  brown: "#795548", // Brown
};

/**
 * Generates a color from a predefined palette for chart consistency
 * @param index The index of the item needing a color
 * @returns A color string in hex format
 */
export function generateChartColor(index: number): string {
  const predefinedColors = Object.values(CHART_COLORS);

  // If more items than predefined colors, generate a unique color
  if (index < predefinedColors.length) return predefinedColors[index];

  // Generate color dynamically based on index
  const hue = (index * 137) % 360; // Golden ratio conjugate to ensure good distribution
  return `hsl(${hue}, 70%, 50%)`;
}

/**
 * Generates a lighter variant of a color for hover/highlight states
 * @param color The base color (hex, rgb, or hsl)
 * @returns A lighter version of the color
 */
export function getLighterColor(color: string): string {
  // Handle hex colors
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    // Convert to RGB
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    // Make lighter
    return `rgba(${r}, ${g}, ${b}, 0.7)`;
  }

  // Handle hsl colors
  if (color.startsWith("hsl")) {
    // Extract hue and saturation, increase lightness
    const match = /hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/.exec(color);
    if (match) {
      const [, h, s, l] = match;
      const newL = Math.min(Number(l) + 15, 90); // Increase lightness, cap at 90%
      return `hsl(${h}, ${s}%, ${newL}%)`;
    }
  }

  // Fallback for other formats
  return color;
}
