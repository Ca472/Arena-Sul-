"use server";

import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAdminIdentity } from "@/lib/auth/admin";
import { getRuntimeMode } from "@/lib/config/runtime";
import {
  getSiteMediaExtension,
  hasExpectedSiteMediaSignature,
  isSiteMediaSlot,
  SITE_MEDIA_MAX_FILE_SIZE,
  SITE_MEDIA_MIME_TYPES,
  type SiteMediaMimeType,
  type SiteMediaSlot,
} from "@/lib/site-media/catalog";
import { SITE_MEDIA_BUCKET } from "@/lib/site-media/queries";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

const mimeTypeSchema = z.enum(SITE_MEDIA_MIME_TYPES);
const uuidPattern =
  "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const UPLOAD_PROOF_LIFETIME_MS = 2 * 60 * 60 * 1000;

const prepareUploadSchema = z.object({
  slot: z.string().trim(),
  originalName: z.string().trim().min(1).max(255),
  mimeType: mimeTypeSchema,
  sizeBytes: z.number().int().min(1).max(SITE_MEDIA_MAX_FILE_SIZE),
});

const finalizeUploadSchema = prepareUploadSchema.extend({
  storagePath: z.string().trim().min(1).max(500),
  uploadProof: z.string().trim().min(1).max(2048),
  width: z.number().int().min(1).max(50000),
  height: z.number().int().min(1).max(50000),
});

const restoreSchema = z.object({
  slot: z.string().trim(),
});

const uploadProofPayloadSchema = z.object({
  version: z.literal(1),
  slot: z.string(),
  storagePath: z.string(),
  originalName: z.string(),
  mimeType: mimeTypeSchema,
  sizeBytes: z.number().int(),
  adminId: z.string().uuid(),
  expiresAt: z.number().int(),
});

type ActionFailure = {
  status: "error" | "demo";
  message: string;
};

export type PrepareSiteMediaUploadResult =
  | ActionFailure
  | {
      status: "success";
      message: string;
      storagePath: string;
      token: string;
      uploadProof: string;
    };

export type SiteMediaMutationResult =
  | ActionFailure
  | {
      status: "success";
      message: string;
    };

function validateSlot(value: string): SiteMediaSlot | null {
  return isSiteMediaSlot(value) ? value : null;
}

function getExpectedStoragePathPattern(
  slot: SiteMediaSlot,
  mimeType: SiteMediaMimeType,
) {
  const extension = getSiteMediaExtension(mimeType);
  return new RegExp(`^${slot}/${uuidPattern}\\.${extension}$`, "i");
}

function getUploadProofSecret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
}

function signUploadProofPayload(encodedPayload: string) {
  return createHmac("sha256", getUploadProofSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function createUploadProof(payload: z.infer<typeof uploadProofPayloadSchema>) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  return `${encodedPayload}.${signUploadProofPayload(encodedPayload)}`;
}

function readUploadProof(uploadProof: string) {
  if (!getUploadProofSecret()) {
    return null;
  }

  const [encodedPayload, suppliedSignature, unexpectedPart] =
    uploadProof.split(".");
  if (!encodedPayload || !suppliedSignature || unexpectedPart) {
    return null;
  }

  const expectedSignature = signUploadProofPayload(encodedPayload);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const parsed = uploadProofPayloadSchema.safeParse(
      JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")),
    );
    if (!parsed.success || parsed.data.expiresAt < Date.now()) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function uploadProofMatches(
  uploadProof: string,
  expected: {
    adminId: string;
    slot: SiteMediaSlot;
    storagePath: string;
    mimeType: SiteMediaMimeType;
    originalName?: string;
    sizeBytes?: number;
  },
) {
  const proof = readUploadProof(uploadProof);
  return Boolean(
    proof &&
      proof.adminId === expected.adminId &&
      proof.slot === expected.slot &&
      proof.storagePath === expected.storagePath &&
      proof.mimeType === expected.mimeType &&
      (expected.originalName === undefined ||
        proof.originalName === expected.originalName) &&
      (expected.sizeBytes === undefined ||
        proof.sizeBytes === expected.sizeBytes),
  );
}

async function getAuthorizedAdmin() {
  const admin = await getAdminIdentity();
  if (!admin) {
    return { admin: null, failure: "Sua sessão expirou. Entre novamente." };
  }
  if (admin.isDemo || getRuntimeMode() !== "supabase") {
    return {
      admin: null,
      failure: "O modo demonstração não altera as fotos do portal.",
    };
  }
  return { admin, failure: null };
}

export async function prepareSiteMediaUploadAction(
  input: unknown,
): Promise<PrepareSiteMediaUploadResult> {
  const parsed = prepareUploadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Selecione uma imagem JPG, PNG ou WebP de até 10 MB.",
    };
  }

  const slot = validateSlot(parsed.data.slot);
  if (!slot) {
    return { status: "error", message: "A posição da foto é inválida." };
  }

  const { admin, failure } = await getAuthorizedAdmin();
  if (!admin) {
    return {
      status: getRuntimeMode() === "demo" ? "demo" : "error",
      message: failure ?? "Acesso administrativo não confirmado.",
    };
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return {
      status: "error",
      message: "O armazenamento não está configurado no servidor.",
    };
  }

  const extension = getSiteMediaExtension(parsed.data.mimeType);
  const storagePath = `${slot}/${randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage
    .from(SITE_MEDIA_BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: false });

  if (error || !data?.token) {
    console.error("Falha ao preparar o upload de uma foto do site.", {
      slot,
      message: error?.message,
    });
    return {
      status: "error",
      message: "Não foi possível preparar o envio. Tente novamente.",
    };
  }

  return {
    status: "success",
    message: "Envio autorizado.",
    storagePath,
    token: data.token,
    uploadProof: createUploadProof({
      version: 1,
      slot,
      storagePath,
      originalName: parsed.data.originalName,
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
      adminId: admin.id,
      expiresAt: Date.now() + UPLOAD_PROOF_LIFETIME_MS,
    }),
  };
}

export async function finalizeSiteMediaUploadAction(
  input: unknown,
): Promise<SiteMediaMutationResult> {
  const parsed = finalizeUploadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Os dados da foto enviada são inválidos.",
    };
  }

  const slot = validateSlot(parsed.data.slot);
  if (!slot) {
    return { status: "error", message: "A posição da foto é inválida." };
  }

  if (
    !getExpectedStoragePathPattern(slot, parsed.data.mimeType).test(
      parsed.data.storagePath,
    )
  ) {
    return { status: "error", message: "O caminho da foto é inválido." };
  }

  const { admin, failure } = await getAuthorizedAdmin();
  if (!admin) {
    return {
      status: getRuntimeMode() === "demo" ? "demo" : "error",
      message: failure ?? "Acesso administrativo não confirmado.",
    };
  }

  if (
    !uploadProofMatches(parsed.data.uploadProof, {
      adminId: admin.id,
      slot,
      storagePath: parsed.data.storagePath,
      mimeType: parsed.data.mimeType,
      originalName: parsed.data.originalName,
      sizeBytes: parsed.data.sizeBytes,
    })
  ) {
    return {
      status: "error",
      message: "A autorização temporária deste envio expirou ou é inválida.",
    };
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return {
      status: "error",
      message: "O armazenamento não está configurado no servidor.",
    };
  }

  const bucket = supabase.storage.from(SITE_MEDIA_BUCKET);
  const { data: objectInfo, error: infoError } = await bucket.info(
    parsed.data.storagePath,
  );
  const storedContentType = objectInfo?.contentType?.split(";", 1)[0];
  const storedSize = objectInfo?.size;

  if (
    infoError ||
    !objectInfo ||
    storedContentType !== parsed.data.mimeType ||
    !storedSize ||
    storedSize !== parsed.data.sizeBytes ||
    storedSize > SITE_MEDIA_MAX_FILE_SIZE
  ) {
    console.error("O arquivo enviado não passou pela validação do Storage.", {
      slot,
      storedContentType,
      storedSize,
      message: infoError?.message,
    });
    return {
      status: "error",
      message: "O arquivo enviado não pôde ser validado como imagem.",
    };
  }

  const { data: storedFile, error: downloadError } = await bucket.download(
    parsed.data.storagePath,
  );
  const signatureBytes = storedFile
    ? new Uint8Array(await storedFile.slice(0, 12).arrayBuffer())
    : null;

  if (
    downloadError ||
    !signatureBytes ||
    !hasExpectedSiteMediaSignature(signatureBytes, parsed.data.mimeType)
  ) {
    console.error("A assinatura binária da foto enviada é inválida.", {
      slot,
      message: downloadError?.message,
    });
    return {
      status: "error",
      message: "O conteúdo do arquivo não corresponde ao formato informado.",
    };
  }

  const { error: saveError } = await supabase.from("site_media").upsert(
    {
      slot,
      storage_path: parsed.data.storagePath,
      original_name: parsed.data.originalName,
      mime_type: parsed.data.mimeType,
      size_bytes: parsed.data.sizeBytes,
      width: parsed.data.width,
      height: parsed.data.height,
      updated_by: admin.id,
    },
    { onConflict: "slot" },
  );

  if (saveError) {
    console.error("Falha ao registrar uma foto do site.", {
      slot,
      code: saveError.code,
      message: saveError.message,
    });
    return {
      status: "error",
      message: "A foto foi enviada, mas não pôde ser publicada.",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/fotos");

  // Previous immutable objects are intentionally retained. Deleting them in
  // this request could race with another publication after a network timeout.

  return {
    status: "success",
    message: "Foto atualizada no site.",
  };
}

export async function restoreSiteMediaDefaultAction(
  input: unknown,
): Promise<SiteMediaMutationResult> {
  const parsed = restoreSchema.safeParse(input);
  const slot = parsed.success ? validateSlot(parsed.data.slot) : null;
  if (!slot) {
    return { status: "error", message: "A posição da foto é inválida." };
  }

  const { admin, failure } = await getAuthorizedAdmin();
  if (!admin) {
    return {
      status: getRuntimeMode() === "demo" ? "demo" : "error",
      message: failure ?? "Acesso administrativo não confirmado.",
    };
  }

  const supabase = createSupabaseServiceRoleClient();
  if (!supabase) {
    return {
      status: "error",
      message: "O armazenamento não está configurado no servidor.",
    };
  }

  const { data: current, error: lookupError } = await supabase
    .from("site_media")
    .select("slot")
    .eq("slot", slot)
    .maybeSingle();

  if (lookupError) {
    return { status: "error", message: "Não foi possível localizar a foto." };
  }

  if (!current) {
    return { status: "success", message: "A foto original já está em uso." };
  }

  const { error: deleteError } = await supabase
    .from("site_media")
    .delete()
    .eq("slot", slot);

  if (deleteError) {
    return {
      status: "error",
      message: "Não foi possível restaurar a foto original.",
    };
  }

  revalidatePath("/");
  revalidatePath("/admin/fotos");

  return {
    status: "success",
    message: "Foto original restaurada no site.",
  };
}
