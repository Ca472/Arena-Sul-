"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  saveEventAction,
  type AdminActionState,
} from "@/app/admin/actions";
import styles from "@/app/admin/admin.module.css";
import type { ArenaEvent } from "@/lib/events/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PHOTOS = 20;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const INITIAL_STATE: AdminActionState = {
  status: "idle",
  message: "",
};

type PendingPhoto = {
  key: string;
  file: File;
  previewUrl: string;
  width: number | null;
  height: number | null;
};

type UploadedPhoto = {
  storagePath: string;
  originalName: string;
  altText: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  sizeBytes: number;
  width: number | null;
  height: number | null;
  displayOrder: number;
};

type EventFormProps = {
  eventId: string;
  initialEvent?: ArenaEvent | null;
  demoMode: boolean;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeFileName(value: string) {
  const extension = value.split(".").pop()?.toLowerCase() ?? "jpg";
  const base = value.replace(/\.[^.]+$/, "");
  return `${slugify(base).slice(0, 80) || "foto"}.${extension}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toArenaLocalDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "America/Sao_Paulo",
  });
  return formatter.format(new Date(value)).replace(" ", "T");
}

function readDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve({
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
    image.onerror = () => reject(new Error("Arquivo de imagem inválido."));
    image.src = url;
  });
}

export function EventForm({ eventId, initialEvent, demoMode }: EventFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [slug, setSlug] = useState(initialEvent?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initialEvent));
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const pendingPhotosRef = useRef<PendingPhoto[]>([]);
  const [state, setState] = useState<AdminActionState>(INITIAL_STATE);
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  function replacePendingPhotos(next: PendingPhoto[]) {
    pendingPhotosRef.current = next;
    setPendingPhotos(next);
  }

  useEffect(() => {
    return () => {
      pendingPhotosRef.current.forEach(({ previewUrl }) => {
        URL.revokeObjectURL(previewUrl);
      });
    };
  }, []);

  function changeTitle(nextTitle: string) {
    setTitle(nextTitle);
    if (!slugEdited) {
      setSlug(slugify(nextTitle));
    }
  }

  async function selectFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setFileError("");
    const room = MAX_PHOTOS - (initialEvent?.photos.length ?? 0) - pendingPhotos.length;
    if (room <= 0) {
      setFileError(`Cada evento pode ter até ${MAX_PHOTOS} fotos.`);
      return;
    }

    const selected = Array.from(files).slice(0, room);
    if (files.length > room) {
      setFileError(`Apenas ${room} foto${room === 1 ? " foi adicionada" : "s foram adicionadas"}.`);
    }

    const next: PendingPhoto[] = [];
    for (const file of selected) {
      if (!ACCEPTED_TYPES.has(file.type)) {
        setFileError("Use apenas imagens JPG, PNG ou WebP.");
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`${file.name} ultrapassa o limite de 10 MB.`);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      try {
        const dimensions = await readDimensions(previewUrl);
        next.push({
          key: crypto.randomUUID(),
          file,
          previewUrl,
          width: dimensions.width,
          height: dimensions.height,
        });
      } catch {
        URL.revokeObjectURL(previewUrl);
        setFileError(`${file.name} não pôde ser lida como imagem.`);
      }
    }

    replacePendingPhotos([...pendingPhotos, ...next]);
  }

  function removePendingPhoto(key: string) {
    const photo = pendingPhotos.find((item) => item.key === key);
    if (photo) {
      URL.revokeObjectURL(photo.previewUrl);
    }
    replacePendingPhotos(pendingPhotos.filter((item) => item.key !== key));
  }

  async function removeUploadedFiles(paths: string[]) {
    if (paths.length === 0) {
      return;
    }
    const client = createSupabaseBrowserClient();
    await client?.storage.from("event-photos").remove(paths);
  }

  async function uploadPhotos(): Promise<UploadedPhoto[]> {
    if (pendingPhotos.length === 0) {
      return [];
    }

    if (demoMode) {
      return pendingPhotos.map((photo, index) => ({
        storagePath: `${eventId}/demo-${photo.key}-${safeFileName(photo.file.name)}`,
        originalName: photo.file.name,
        altText: title,
        mimeType: photo.file.type as UploadedPhoto["mimeType"],
        sizeBytes: photo.file.size,
        width: photo.width,
        height: photo.height,
        displayOrder: (initialEvent?.photos.length ?? 0) + index,
      }));
    }

    const client = createSupabaseBrowserClient();
    if (!client) {
      throw new Error("Supabase não está disponível no navegador.");
    }

    const uploads: UploadedPhoto[] = [];
    for (const [index, photo] of pendingPhotos.entries()) {
      const storagePath = `${eventId}/${crypto.randomUUID()}-${safeFileName(photo.file.name)}`;
      const { error } = await client.storage
        .from("event-photos")
        .upload(storagePath, photo.file, {
          cacheControl: "31536000",
          contentType: photo.file.type,
          upsert: false,
        });

      if (error) {
        await removeUploadedFiles(uploads.map(({ storagePath: path }) => path));
        throw new Error(`Falha no upload de ${photo.file.name}: ${error.message}`);
      }

      uploads.push({
        storagePath,
        originalName: photo.file.name,
        altText: title,
        mimeType: photo.file.type as UploadedPhoto["mimeType"],
        sizeBytes: photo.file.size,
        width: photo.width,
        height: photo.height,
        displayOrder: (initialEvent?.photos.length ?? 0) + index,
      });
      setUploadProgress(Math.round(((index + 1) / pendingPhotos.length) * 100));
    }

    return uploads;
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setState(INITIAL_STATE);
    setUploadProgress(0);

    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const formData = new FormData(event.currentTarget);
    formData.set("submitIntent", submitter?.value === "publish" ? "publish" : "draft");

    let uploadedPhotos: UploadedPhoto[] = [];
    try {
      uploadedPhotos = await uploadPhotos();
      formData.set("uploads", JSON.stringify(uploadedPhotos));
      const result = await saveEventAction(INITIAL_STATE, formData);

      if ((result.status === "error" && !result.persisted) || result.cleanupUploads) {
        await removeUploadedFiles(uploadedPhotos.map(({ storagePath }) => storagePath));
      }

      setState(result);

      if (result.status === "success" && result.eventId) {
        pendingPhotos.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
        replacePendingPhotos([]);
        router.replace(`/admin/eventos/${result.eventId}/editar`);
        router.refresh();
      }
    } catch (error) {
      await removeUploadedFiles(uploadedPhotos.map(({ storagePath }) => storagePath));
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Não foi possível salvar o evento.",
        persisted: false,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const hasExistingPhotos = (initialEvent?.photos.length ?? 0) > 0;

  return (
    <form onSubmit={submitForm}>
      <input name="eventId" type="hidden" value={eventId} />
      <div className={styles.formGrid}>
        <div className={styles.formStack}>
          <section className={styles.formSection}>
            <h2>Informações do evento</h2>
            <div className={styles.field}>
              <label htmlFor="title">Título</label>
              <input
                id="title"
                name="title"
                value={title}
                onChange={(event) => changeTitle(event.target.value)}
                minLength={3}
                maxLength={120}
                placeholder="Ex.: Evento Corporativo Arena Sul"
                required
              />
              {state.fieldErrors?.title?.map((message) => (
                <p className={styles.fieldError} key={message}>{message}</p>
              ))}
            </div>

            <div className={styles.field}>
              <label htmlFor="slug">Endereço no portal</label>
              <input
                id="slug"
                name="slug"
                value={slug}
                onChange={(event) => {
                  setSlug(slugify(event.target.value));
                  setSlugEdited(true);
                }}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                required
              />
              <p className={styles.fieldHint}>www.arenasulsports.com/eventos/{slug || "nome-do-evento"}</p>
              {state.fieldErrors?.slug?.map((message) => (
                <p className={styles.fieldError} key={message}>{message}</p>
              ))}
            </div>

            <div className={styles.field}>
              <label htmlFor="excerpt">Resumo</label>
              <input
                id="excerpt"
                name="excerpt"
                defaultValue={initialEvent?.excerpt ?? ""}
                maxLength={240}
                placeholder="Uma frase curta para os cards do portal"
              />
              {state.fieldErrors?.excerpt?.map((message) => (
                <p className={styles.fieldError} key={message}>{message}</p>
              ))}
            </div>

            <div className={styles.field}>
              <label htmlFor="description">Descrição completa</label>
              <textarea
                id="description"
                name="description"
                defaultValue={initialEvent?.description ?? ""}
                minLength={20}
                maxLength={10000}
                placeholder="Conte como foi ou como será o evento…"
                required
              />
              {state.fieldErrors?.description?.map((message) => (
                <p className={styles.fieldError} key={message}>{message}</p>
              ))}
            </div>
          </section>

          <section className={styles.formSection}>
            <h2>Data e local</h2>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label htmlFor="startsAt">Início</label>
                <input
                  id="startsAt"
                  name="startsAt"
                  type="datetime-local"
                  defaultValue={toArenaLocalDateTime(initialEvent?.startsAt ?? null)}
                  required
                />
                {state.fieldErrors?.startsAt?.map((message) => (
                  <p className={styles.fieldError} key={message}>{message}</p>
                ))}
              </div>
              <div className={styles.field}>
                <label htmlFor="endsAt">Término (opcional)</label>
                <input
                  id="endsAt"
                  name="endsAt"
                  type="datetime-local"
                  defaultValue={toArenaLocalDateTime(initialEvent?.endsAt ?? null)}
                />
                {state.fieldErrors?.endsAt?.map((message) => (
                  <p className={styles.fieldError} key={message}>{message}</p>
                ))}
              </div>
            </div>
            <p className={styles.fieldHint}>Datas interpretadas no horário de Brasília.</p>
            <div className={styles.field}>
              <label htmlFor="location">Local</label>
              <input
                id="location"
                name="location"
                defaultValue={initialEvent?.location ?? "Arena Sul Sports"}
                maxLength={180}
              />
            </div>
          </section>

          <section className={styles.formSection}>
            <h2>Adicionar fotos</h2>
            <label className={styles.dropzone} htmlFor="photos">
              <span className={styles.uploadButton}>Selecionar várias fotos</span>
              <p>JPG, PNG ou WebP · até 10 MB por arquivo · máximo de 20 por evento</p>
              <input
                id="photos"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={async (event) => {
                  await selectFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>

            {fileError ? <div className={styles.errorNotice}>{fileError}</div> : null}

            {pendingPhotos.length > 0 ? (
              <div className={styles.previewGrid}>
                {pendingPhotos.map((photo) => (
                  <article className={styles.previewCard} key={photo.key}>
                    <button
                      className={styles.removePreview}
                      type="button"
                      onClick={() => removePendingPhoto(photo.key)}
                      aria-label={`Remover ${photo.file.name}`}
                    >
                      ×
                    </button>
                    <div className={styles.previewImage}>
                      <Image
                        src={photo.previewUrl}
                        alt={`Prévia de ${photo.file.name}`}
                        fill
                        sizes="(max-width: 430px) calc(100vw - 68px), (max-width: 680px) 50vw, 220px"
                        unoptimized
                      />
                    </div>
                    <div className={styles.previewMeta}>
                      <strong>{photo.file.name}</strong>
                      <span>{formatBytes(photo.file.size)}</span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className={styles.fieldHint}>
                {hasExistingPhotos
                  ? "As fotos já salvas aparecem abaixo do formulário."
                  : "Nenhuma foto selecionada."}
              </p>
            )}
          </section>
        </div>

        <aside className={styles.actionsCard}>
          <h2>{initialEvent ? "Atualizar evento" : "Finalizar cadastro"}</h2>
          <p>
            Salve como rascunho para revisar depois ou publique para mostrar imediatamente no portal.
          </p>

          {demoMode ? (
            <div className={styles.notice}>
              Teste livremente. Neste modo, o envio termina em uma simulação sem persistência.
            </div>
          ) : null}

          {submitting && pendingPhotos.length > 0 ? (
            <div className={styles.uploadProgress} aria-live="polite">
              <span className={styles.fieldHint}>
                {uploadProgress < 100 ? `Enviando fotos: ${uploadProgress}%` : "Registrando conteúdo…"}
              </span>
              <div className={styles.progressTrack}>
                <div className={styles.progressBar} style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          ) : null}

          {state.message ? (
            <div
              className={
                state.status === "error"
                  ? styles.errorNotice
                  : state.status === "success"
                    ? styles.successNotice
                    : styles.notice
              }
              role="status"
            >
              {state.message}
            </div>
          ) : null}

          <button
            className={styles.secondaryButton}
            type="submit"
            name="submitIntent"
            value="draft"
            disabled={submitting}
          >
            {submitting ? "Processando…" : initialEvent?.status === "published" ? "Voltar para rascunho" : "Salvar rascunho"}
          </button>
          <button
            className={styles.primaryButton}
            type="submit"
            name="submitIntent"
            value="publish"
            disabled={submitting}
          >
            {submitting ? "Processando…" : initialEvent?.status === "published" ? "Atualizar publicação" : "Publicar agora"}
          </button>
        </aside>
      </div>
    </form>
  );
}
