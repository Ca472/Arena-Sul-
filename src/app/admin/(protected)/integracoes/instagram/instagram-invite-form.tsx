"use client";

import { useActionState, useState } from "react";

import {
  createInstagramInviteAction,
  type InstagramInviteActionState,
} from "@/app/admin/(protected)/integracoes/instagram/actions";
import styles from "@/app/admin/admin.module.css";

const initialInstagramInviteState: InstagramInviteActionState = {
  status: "idle",
  message: "",
  inviteUrl: null,
  expiresAt: null,
};

export function InstagramInviteForm() {
  const [state, action, pending] = useActionState(
    createInstagramInviteAction,
    initialInstagramInviteState,
  );
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    if (!state.inviteUrl) {
      return;
    }

    await navigator.clipboard.writeText(state.inviteUrl);
    setCopied(true);
  }

  return (
    <div className={styles.inviteForm}>
      <form action={action}>
        <button className={styles.primaryButton} disabled={pending} type="submit">
          {pending ? "Gerando convite…" : "Gerar link de autorização"}
        </button>
      </form>

      {state.status !== "idle" ? (
        <p
          className={
            state.status === "success"
              ? styles.successNotice
              : styles.errorNotice
          }
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      {state.inviteUrl ? (
        <div className={styles.inviteOutput}>
          <label htmlFor="instagram-invite-url">Link para o responsável</label>
          <textarea
            className={styles.inviteUrl}
            id="instagram-invite-url"
            readOnly
            rows={4}
            value={state.inviteUrl}
          />
          <button
            className={styles.secondaryButton}
            onClick={copyInvite}
            type="button"
          >
            {copied ? "Link copiado" : "Copiar link"}
          </button>
          <p className={styles.fieldHint}>
            Válido até {new Date(state.expiresAt ?? "").toLocaleString("pt-BR")}
            . O link funciona uma única vez.
          </p>
        </div>
      ) : null}
    </div>
  );
}
