export const ARENA_WHATSAPP_NUMBER = "551233071093";

export const DEFAULT_WHATSAPP_MESSAGE =
  "Olá, Arena Sul! Gostaria de conhecer as modalidades, aulas e horários disponíveis.";

export function buildWhatsAppUrl(message = DEFAULT_WHATSAPP_MESSAGE) {
  return `https://wa.me/${ARENA_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
