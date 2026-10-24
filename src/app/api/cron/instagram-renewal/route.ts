import { handleInstagramRenewalCron } from "@/lib/instagram/renewal-handler";
import { renewStoredInstagramToken } from "@/lib/instagram/renewal-store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export function GET(request: Request) {
  return handleInstagramRenewalCron(request, {
    secret: process.env.CRON_SECRET,
    renew: renewStoredInstagramToken,
  });
}
