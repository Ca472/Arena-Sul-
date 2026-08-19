"use server";

import { getInstagramPortalOrigin } from "@/lib/instagram/config";
import { createInstagramInvite } from "@/lib/instagram/oauth-store";
import { isInstagramOAuthReady } from "@/lib/instagram/readiness";
import { getAdminIdentity } from "@/lib/auth/admin";

export type InstagramInviteActionState = {
  status: "idle" | "success" | "error";
  message: string;
  inviteUrl: string | null;
  expiresAt: string | null;
};

export async function createInstagramInviteAction(
  _previousState: InstagramInviteActionState,
): Promise<InstagramInviteActionState> {
  void _previousState;

  const admin = await getAdminIdentity();
  const origin = getInstagramPortalOrigin();

  if (!admin || admin.isDemo) {
    return {
      status: "error",
      message: "Entre como administrador real para gerar o convite.",
      inviteUrl: null,
      expiresAt: null,
    };
  }

  if (!origin || !isInstagramOAuthReady()) {
    return {
      status: "error",
      message: "A integração do Instagram ainda não está configurada.",
      inviteUrl: null,
      expiresAt: null,
    };
  }

  try {
    const invite = await createInstagramInvite(admin.id);
    const url = new URL("/integracoes/instagram/autorizar", origin);
    url.searchParams.set("convite", invite.token);

    return {
      status: "success",
      message: "Convite criado. Envie somente este link ao responsável pelo Instagram.",
      inviteUrl: url.toString(),
      expiresAt: invite.expiresAt,
    };
  } catch {
    return {
      status: "error",
      message: "Não foi possível gerar o convite. Verifique a configuração e tente novamente.",
      inviteUrl: null,
      expiresAt: null,
    };
  }
}
