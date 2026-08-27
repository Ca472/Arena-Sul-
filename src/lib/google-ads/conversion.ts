export const GOOGLE_ADS_WHATSAPP_CONVERSION_SEND_TO =
  "AW-18397690648/Jok9CPrJ6-gcEJj22cRE";

const WHATSAPP_HOSTNAMES = new Set([
  "wa.me",
  "api.whatsapp.com",
  "web.whatsapp.com",
]);

export type GoogleAdsWhatsAppConversionParameters = {
  send_to: typeof GOOGLE_ADS_WHATSAPP_CONVERSION_SEND_TO;
};

export function isWhatsAppUrl(value: string): boolean {
  try {
    const url = new URL(value);

    return url.protocol === "https:" && WHATSAPP_HOSTNAMES.has(url.hostname);
  } catch {
    return false;
  }
}

export function isWhatsAppUrlForNumber(
  value: string,
  expectedNumber: string,
): boolean {
  try {
    const url = new URL(value);
    if (!isWhatsAppUrl(value)) {
      return false;
    }

    const destinationNumber =
      url.hostname === "wa.me"
        ? url.pathname.split("/").filter(Boolean)[0]
        : url.searchParams.get("phone");

    return destinationNumber?.replace(/\D/g, "") === expectedNumber;
  } catch {
    return false;
  }
}

export function getGoogleAdsWhatsAppConversionParameters(
  href: string,
  expectedNumber: string,
): GoogleAdsWhatsAppConversionParameters | null {
  if (!isWhatsAppUrlForNumber(href, expectedNumber)) {
    return null;
  }

  return {
    send_to: GOOGLE_ADS_WHATSAPP_CONVERSION_SEND_TO,
  };
}
