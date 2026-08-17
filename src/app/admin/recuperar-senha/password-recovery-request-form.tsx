"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";

import styles from "@/app/admin/admin.module.css";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const emailSchema = z.string().trim().email("Informe um e-mail válido.");

const GENERIC_SUCCESS_MESSAGE =
  "Se o e-mail estiver autorizado, você receberá um link para redefinir a senha. Abra esse link neste mesmo navegador.";

export function PasswordRecoveryRequestForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldError, setFieldError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setFieldError("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const parsed = emailSchema.safeParse(formData.get("email"));

    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? "Revise o e-mail.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("A autenticação não está configurada.");
      return;
    }

    setPending(true);

    try {
      const redirectTo = new URL(
        "/auth/recovery",
        window.location.origin,
      ).toString();

      // The response is deliberately identical for known and unknown users.
      // Authorization is still enforced by public.admins after the callback.
      await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo });
      form.reset();
      setMessage(GENERIC_SUCCESS_MESSAGE);
    } catch {
      // Network and provider errors are kept generic as well, so this public
      // endpoint cannot be used to enumerate administrative accounts.
      setMessage(GENERIC_SUCCESS_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="recovery-email">E-mail administrativo</label>
        <input
          id="recovery-email"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          required
        />
        {fieldError ? (
          <p className={styles.fieldError}>{fieldError}</p>
        ) : null}
      </div>

      {message ? (
        <div className={styles.successNotice} role="status">
          {message}
        </div>
      ) : null}

      <button className={styles.primaryButton} disabled={pending} type="submit">
        {pending ? "Solicitando…" : "Enviar link seguro"}
      </button>
    </form>
  );
}
