"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getAdminIdentity } from "@/lib/auth/admin";
import { getRuntimeMode } from "@/lib/config/runtime";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminActionState = {
  status: "idle" | "success" | "error" | "demo";
  message: string;
  eventId?: string;
  persisted?: boolean;
  cleanupUploads?: boolean;
  fieldErrors?: Record<string, string[]>;
};

const loginSchema = z.object({
  email: z.email("Informe um e-mail válido.").trim(),
  password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

const uploadedPhotoSchema = z.object({
  storagePath: z.string().min(1).max(500),
  originalName: z.string().min(1).max(255),
  altText: z.string().max(240),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().nonnegative().max(10 * 1024 * 1024),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  displayOrder: z.number().int().nonnegative(),
});

const eventSchema = z
  .object({
    eventId: z.uuid("Identificador do evento inválido."),
    title: z.string().trim().min(3, "Informe um título com pelo menos 3 caracteres.").max(120),
    slug: z
      .string()
      .trim()
      .min(3, "Informe a URL do evento.")
      .max(140)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens."),
    excerpt: z.string().trim().max(240, "O resumo pode ter até 240 caracteres."),
    description: z
      .string()
      .trim()
      .min(20, "A descrição precisa ter pelo menos 20 caracteres.")
      .max(10000),
    location: z.string().trim().max(180),
    startsAt: z.string().trim().min(1, "Informe a data de início."),
    endsAt: z.string().trim(),
    submitIntent: z.enum(["draft", "publish"]),
    uploads: z.array(uploadedPhotoSchema).max(20),
  })
  .superRefine((value, context) => {
    const startsAt = parseArenaDate(value.startsAt);
    const endsAt = value.endsAt ? parseArenaDate(value.endsAt) : null;

    if (!startsAt) {
      context.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: "Data de início inválida.",
      });
    }

    if (value.endsAt && !endsAt) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "Data de término inválida.",
      });
    }

    if (startsAt && endsAt && endsAt < startsAt) {
      context.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "O término precisa ocorrer depois do início.",
      });
    }

    for (const upload of value.uploads) {
      if (!upload.storagePath.startsWith(`${value.eventId}/`)) {
        context.addIssue({
          code: "custom",
          path: ["uploads"],
          message: "Uma das fotos não pertence a este evento.",
        });
        break;
      }
    }
  });

const deletePhotoSchema = z.object({
  photoId: z.uuid(),
  eventId: z.uuid(),
});

function parseArenaDate(value: string): Date | null {
  const normalised = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    ? `${value}:00-03:00`
    : value;
  const date = new Date(normalised);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseUploads(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.length === 0) {
    return [];
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export async function loginAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const mode = getRuntimeMode();

  if (mode === "demo") {
    return {
      status: "demo",
      message: "O modo demonstração não autentica usuários. Use o botão “Entrar na demonstração”.",
      persisted: false,
    };
  }

  if (mode === "misconfigured") {
    return {
      status: "error",
      message: "Supabase não configurado. Revise as variáveis de ambiente.",
      persisted: false,
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      persisted: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      status: "error",
      message: "Não foi possível inicializar a autenticação.",
      persisted: false,
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return {
      status: "error",
      message: "E-mail ou senha incorretos.",
      persisted: false,
    };
  }

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!admin) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "Esta conta não está autorizada a administrar o portal.",
      persisted: false,
    };
  }

  redirect("/admin");
}

export async function logoutAction() {
  if (getRuntimeMode() === "supabase") {
    const supabase = await createSupabaseServerClient();
    await supabase?.auth.signOut();
  }

  redirect("/admin/login");
}

export async function saveEventAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const uploads = parseUploads(formData.get("uploads"));
  const parsed = eventSchema.safeParse({
    eventId: formData.get("eventId"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt") ?? "",
    description: formData.get("description"),
    location: formData.get("location") ?? "",
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt") ?? "",
    submitIntent: formData.get("submitIntent"),
    uploads,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos do evento antes de salvar.",
      fieldErrors: parsed.error.flatten().fieldErrors,
      persisted: false,
    };
  }

  if (getRuntimeMode() === "demo") {
    return {
      status: "demo",
      message:
        "Demonstração concluída: o formulário e as fotos foram validados, mas nenhuma informação foi salva.",
      eventId: parsed.data.eventId,
      persisted: false,
    };
  }

  const admin = await getAdminIdentity();
  if (!admin) {
    return {
      status: "error",
      message: "Sua sessão expirou. Entre novamente antes de salvar.",
      persisted: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      status: "error",
      message: "Supabase não está configurado.",
      persisted: false,
    };
  }

  const { count: existingPhotoCount, error: photoCountError } = await supabase
    .from("event_photos")
    .select("id", { count: "exact", head: true })
    .eq("event_id", parsed.data.eventId);

  if (photoCountError) {
    return {
      status: "error",
      message: "Não foi possível validar a quantidade atual de fotos.",
      persisted: false,
    };
  }

  if ((existingPhotoCount ?? 0) + parsed.data.uploads.length > 20) {
    return {
      status: "error",
      message: "Cada evento pode ter no máximo 20 fotos.",
      fieldErrors: { uploads: ["Remova uma foto antes de adicionar outra."] },
      persisted: false,
    };
  }

  const startsAt = parseArenaDate(parsed.data.startsAt);
  const endsAt = parsed.data.endsAt ? parseArenaDate(parsed.data.endsAt) : null;
  if (!startsAt) {
    return {
      status: "error",
      message: "A data de início é inválida.",
      persisted: false,
    };
  }

  const { error: eventError } = await supabase.from("events").upsert(
    {
      id: parsed.data.eventId,
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt || null,
      description: parsed.data.description,
      location: parsed.data.location || null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt?.toISOString() ?? null,
      status: parsed.data.submitIntent === "publish" ? "published" : "draft",
      updated_by: admin.id,
    },
    { onConflict: "id" },
  );

  if (eventError) {
    const duplicateSlug = eventError.code === "23505";
    if (!duplicateSlug) {
      console.error("Falha ao salvar evento no Supabase.", {
        code: eventError.code,
        message: eventError.message,
      });
    }
    return {
      status: "error",
      message: duplicateSlug
        ? "Essa URL já está sendo usada por outro evento. Escolha outra."
        : "Não foi possível salvar o evento. Tente novamente em instantes.",
      fieldErrors: duplicateSlug ? { slug: ["URL já utilizada."] } : undefined,
      persisted: false,
    };
  }

  if (parsed.data.uploads.length > 0) {
    const { error: photosError } = await supabase.from("event_photos").upsert(
      parsed.data.uploads.map((photo) => ({
        event_id: parsed.data.eventId,
        storage_path: photo.storagePath,
        original_name: photo.originalName,
        alt_text: photo.altText || parsed.data.title,
        mime_type: photo.mimeType,
        size_bytes: photo.sizeBytes,
        width: photo.width,
        height: photo.height,
        display_order: photo.displayOrder,
        created_by: admin.id,
      })),
      { onConflict: "storage_path" },
    );

    if (photosError) {
      return {
        status: "error",
        message:
          "O evento foi salvo, mas houve um erro ao registrar as fotos. Selecione-as novamente e tente salvar.",
        eventId: parsed.data.eventId,
        persisted: true,
        cleanupUploads: true,
      };
    }
  }

  revalidatePath("/");
  revalidatePath(`/eventos/${parsed.data.slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/eventos/${parsed.data.eventId}/editar`);

  return {
    status: "success",
    message:
      parsed.data.submitIntent === "publish"
        ? "Evento publicado no portal."
        : "Rascunho salvo com sucesso.",
    eventId: parsed.data.eventId,
    persisted: true,
  };
}

export async function deletePhotoAction(formData: FormData) {
  const parsed = deletePhotoSchema.safeParse({
    photoId: formData.get("photoId"),
    eventId: formData.get("eventId"),
  });

  if (!parsed.success || getRuntimeMode() !== "supabase") {
    return;
  }

  const admin = await getAdminIdentity();
  const supabase = await createSupabaseServerClient();
  if (!admin || !supabase) {
    return;
  }

  const { data: photo, error: photoLookupError } = await supabase
    .from("event_photos")
    .select("storage_path")
    .eq("id", parsed.data.photoId)
    .eq("event_id", parsed.data.eventId)
    .maybeSingle();

  if (photoLookupError || !photo) {
    return;
  }

  const { error } = await supabase
    .from("event_photos")
    .delete()
    .eq("id", parsed.data.photoId)
    .eq("event_id", parsed.data.eventId);

  if (!error) {
    const { error: storageError } = await supabase.storage
      .from("event-photos")
      .remove([photo.storage_path]);

    if (storageError) {
      console.error("Foto removida do banco, mas não do Storage.", {
        eventId: parsed.data.eventId,
        photoId: parsed.data.photoId,
        message: storageError.message,
      });
    }
  }

  revalidatePath(`/admin/eventos/${parsed.data.eventId}/editar`);
  revalidatePath("/eventos/[slug]", "page");
  revalidatePath("/");
}
