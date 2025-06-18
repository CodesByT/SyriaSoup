import { useTranslation } from "react-i18next";

export const useRTL = () => {
  const { i18n } = useTranslation();

  const isRTL = i18n.language === "ar";

  const rtlStyle = {
    textAlign: isRTL ? ("right" as const) : ("left" as const),
    writingDirection: isRTL ? ("rtl" as const) : ("ltr" as const),
  };

  const rtlViewStyle = {
    flexDirection: isRTL ? ("row-reverse" as const) : ("row" as const),
  };
  const rtlViewStyle_forRangeSlider = {
    justifyContent: isRTL ? ("flex-start" as const) : ("flex-end" as const),
  };

  const rtlContainerStyle = {
    alignItems: isRTL ? ("flex-end" as const) : ("flex-start" as const),
  };

  return {
    isRTL,
    rtlStyle,
    rtlViewStyle,
    rtlContainerStyle,
    rtlViewStyle_forRangeSlider,
    // Helper function to get RTL-aware styles
    getRTLStyle: (ltrStyle: any, rtlStyleOverride?: any) => {
      return isRTL
        ? { ...ltrStyle, ...rtlStyle, ...rtlStyleOverride }
        : ltrStyle;
    },
    // Helper function for flex direction
    getFlexDirection: (defaultDirection: "row" | "column" = "row") => {
      if (defaultDirection === "column") return "column";
      return isRTL ? "row-reverse" : "row";
    },
  };
};
