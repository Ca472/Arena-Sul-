"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  finalizeSiteMediaUploadAction,
  prepareSiteMediaUploadAction,
  restoreSiteMediaDefaultAction,
} from "@/app/admin/(protected)/fotos/actions";
import {
  SITE_MEDIA_MAX_FILE_SIZE,
  SITE_MEDIA_MIME_TYPES,
  SITE_MEDIA_SECTIONS,
  type SiteMediaMimeType,
} from "@/lib/site-media/catalog";
import type { AdminSiteMediaItem } from "@/lib/site-media/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import styles from "./site-media-manager.module.css";

type SelectedImage = {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
};

type MediaCardProps = {
  item: AdminSiteMediaItem;
  demoMode: boolean;
};

const acceptedMimeTypes = new Set<string>(SITE_MEDIA_MIME_TYPES);

const updatedAtFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readImageDimensions(previewUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Arquivo de imagem inválido."));
    image.src = previewUrl;
  });
}

function SiteMediaCard({ item, demoMode }: MediaCardProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<SelectedImage | null>(null);
  const [status, setStatus] = useState<{
    kind: "idle" | "working" | "success" | "error";
    message: string;
  }>({ kind: "idle", message: "" });

  useEffect(() => {
    return () => {
      if (selected?.previewUrl) {
        URL.revokeObjectURL(selected.previewUrl);
      }
    };
  }, [selected]);

  async function selectFile(file: File | null) {
    setStatus({ kind: "idle", message: "" });

    if (selected?.previewUrl) {
      URL.revokeObjectURL(selected.previewUrl);
      setSelected(null);
    }

    if (!file) {
      return;
    }

    if (!acceptedMimeTypes.has(file.type)) {
      setStatus({
        kind: "error",
        message: "Use apenas imagens JPG, PNG ou WebP.",
      });
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    if (file.size > SITE_MEDIA_MAX_FILE_SIZE) {
      setStatus({
        kind: "error",
        message: `${file.name} ultrapassa o limite de 10 MB.`,
      });
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    try {
      const dimensions = await readImageDimensions(previewUrl);
      setSelected({ file, previewUrl, ...dimensions });
    } catch {
      URL.revokeObjectURL(previewUrl);
      setStatus({
        kind: "error",
        message: "O arquivo selecionado não pôde ser lido como imagem.",
      });
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function clearSelection() {
    if (selected?.previewUrl) {
      URL.revokeObjectURL(selected.previewUrl);
    }
    setSelected(null);
    setStatus({ kind: "idle", message: "" });
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function saveSelection() {
    if (!selected || demoMode || status.kind === "working") {
      return;
    }

    const mimeType = selected.file.type as SiteMediaMimeType;

    try {
      setStatus({ kind: "working", message: "Preparando o envio…" });

      const prepared = await prepareSiteMediaUploadAction({
        slot: item.key,
        originalName: selected.file.name,
        mimeType,
        sizeBytes: selected.file.size,
      });

      if (prepared.status !== "success") {
        setStatus({ kind: "error", message: prepared.message });
        return;
      }

      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setStatus({
          kind: "error",
          message: "O armazenamento não está disponível neste navegador.",
        });
        return;
      }

      setStatus({ kind: "working", message: "Enviando a nova foto…" });
      const { error: uploadError } = await supabase.storage
        .from("site-media")
        .uploadToSignedUrl(
          prepared.storagePath,
          prepared.token,
          selected.file,
          {
            cacheControl: "31536000",
            contentType: mimeType,
            upsert: false,
          },
        );

      if (uploadError) {
        setStatus({
          kind: "error",
          message: `Não foi possível enviar a foto: ${uploadError.message}`,
        });
        return;
      }

      setStatus({ kind: "working", message: "Publicando a foto no site…" });
      const result = await finalizeSiteMediaUploadAction({
        slot: item.key,
        storagePath: prepared.storagePath,
        uploadProof: prepared.uploadProof,
        originalName: selected.file.name,
        mimeType,
        sizeBytes: selected.file.size,
        width: selected.width,
        height: selected.height,
      });

      if (result.status !== "success") {
        setStatus({ kind: "error", message: result.message });
        return;
      }

      clearSelection();
      setStatus({ kind: "success", message: result.message });
      router.refresh();
    } catch {
      setStatus({
        kind: "error",
        message:
          "A conexão foi interrompida. A foto atual foi preservada; tente novamente.",
      });
    }
  }

  async function restoreDefault() {
    if (item.isDefault || demoMode || status.kind === "working") {
      return;
    }

    const confirmed = window.confirm(
      `Restaurar a foto original de “${item.label}”?`,
    );
    if (!confirmed) {
      return;
    }

    try {
      setStatus({ kind: "working", message: "Restaurando a foto original…" });
      const result = await restoreSiteMediaDefaultAction({ slot: item.key });

      if (result.status !== "success") {
        setStatus({ kind: "error", message: result.message });
        return;
      }

      clearSelection();
      setStatus({ kind: "success", message: result.message });
      router.refresh();
    } catch {
      setStatus({
        kind: "error",
        message:
          "A conexão foi interrompida. Atualize a página para confirmar o estado da foto.",
      });
    }
  }

  const visibleUrl = selected?.previewUrl ?? item.currentUrl;
  const isWorking = status.kind === "working";

  return (
    <article className={styles.card}>
      <div
        className={styles.preview}
        style={{ aspectRatio: item.previewAspect }}
      >
        <Image
          src={visibleUrl}
          alt={selected ? `Prévia de ${selected.file.name}` : item.alt}
          fill
          sizes="(max-width: 680px) calc(100vw - 56px), (max-width: 1100px) 42vw, 320px"
          unoptimized={Boolean(selected)}
        />
        <span
          className={item.isDefault ? styles.defaultBadge : styles.customBadge}
        >
          {selected
            ? "Nova prévia"
            : item.isDefault
              ? "Foto original"
              : "Foto personalizada"}
        </span>
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardHeading}>
          <h3>{item.label}</h3>
          <p>{item.description}</p>
        </div>

        <div className={styles.guidance}>
          <strong>{item.recommendation}</strong>
          <span>JPG, PNG ou WebP · máximo 10 MB</span>
        </div>

        {item.override && !selected ? (
          <p className={styles.fileMeta}>
            {item.override.originalName} · {formatBytes(item.override.sizeBytes)}
            {item.override.width && item.override.height
              ? ` · ${item.override.width} × ${item.override.height} px`
              : ""}
            <br />
            Atualizada em {updatedAtFormatter.format(new Date(item.override.updatedAt))}
          </p>
        ) : null}

        {selected ? (
          <p className={styles.fileMeta}>
            Nova: {selected.file.name} · {formatBytes(selected.file.size)} ·{" "}
            {selected.width} × {selected.height} px
          </p>
        ) : null}

        <label className={styles.filePicker}>
          <span>{selected ? "Escolher outra foto" : "Escolher nova foto"}</span>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={demoMode || isWorking}
            onChange={(event) => void selectFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <div className={styles.actions}>
          <button
            className={styles.saveButton}
            type="button"
            disabled={!selected || demoMode || isWorking}
            onClick={() => void saveSelection()}
          >
            {isWorking && selected ? "Salvando…" : "Salvar e publicar"}
          </button>
          {selected ? (
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={isWorking}
              onClick={clearSelection}
            >
              Cancelar
            </button>
          ) : !item.isDefault ? (
            <button
              className={styles.secondaryButton}
              type="button"
              disabled={demoMode || isWorking}
              onClick={() => void restoreDefault()}
            >
              Restaurar original
            </button>
          ) : null}
        </div>

        {status.message ? (
          <p
            className={
              status.kind === "error"
                ? styles.errorMessage
                : status.kind === "success"
                  ? styles.successMessage
                  : styles.statusMessage
            }
            role="status"
            aria-live="polite"
          >
            {status.message}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function SiteMediaManager({
  items,
  demoMode,
}: {
  items: AdminSiteMediaItem[];
  demoMode: boolean;
}) {
  return (
    <div className={styles.manager}>
      {SITE_MEDIA_SECTIONS.map((section) => {
        const sectionItems = items.filter((item) => item.section === section);
        return (
          <section className={styles.section} key={section}>
            <div className={styles.sectionHeading}>
              <h2>{section}</h2>
              <span>
                {sectionItems.length} foto{sectionItems.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className={styles.grid}>
              {sectionItems.map((item) => (
                <SiteMediaCard
                  item={item}
                  demoMode={demoMode}
                  key={item.key}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
