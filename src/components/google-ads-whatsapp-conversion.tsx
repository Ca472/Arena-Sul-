"use client";

import { useEffect } from "react";

import { ARENA_WHATSAPP_NUMBER } from "@/lib/config/whatsapp";
import { getGoogleAdsWhatsAppConversionParameters } from "@/lib/google-ads/conversion";

type GoogleAdsWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

export function GoogleAdsWhatsAppConversion() {
  useEffect(() => {
    function reportWhatsAppClick(event: MouseEvent) {
      if (event.defaultPrevented || !(event.target instanceof Element)) {
        return;
      }

      const link = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link) {
        return;
      }

      const conversionParameters =
        getGoogleAdsWhatsAppConversionParameters(
          link.href,
          ARENA_WHATSAPP_NUMBER,
        );
      if (!conversionParameters) {
        return;
      }

      (window as GoogleAdsWindow).gtag?.(
        "event",
        "conversion",
        conversionParameters,
      );
    }

    document.addEventListener("click", reportWhatsAppClick);

    return () => {
      document.removeEventListener("click", reportWhatsAppClick);
    };
  }, []);

  return null;
}
