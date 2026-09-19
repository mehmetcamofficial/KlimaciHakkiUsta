import { useWindowDimensions } from "react-native";

import { getScreenSize, type ScreenSize } from "@/lib/responsive";

export function useScreenSize(): ScreenSize {
  const { width } = useWindowDimensions();
  return getScreenSize(width);
}
