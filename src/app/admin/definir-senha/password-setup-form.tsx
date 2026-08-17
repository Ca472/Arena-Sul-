"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";

import styles from "@/app/admin/admin.module.css";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(12, "Use pelo menos 12 caracteres.")
      .max(128, "Use no máximo 128 caracteres.")
      .regex(/[a-z]/, "Inclua ao menos uma letra minúscula.")
      .regex(/[A-Z]/, "Inclua ao menos uma letra maiúscula.")
      .regex(/[0-9]/, "Inclua ao menos um número.")
      .regex(/[^A-Za-z0-9]/, "Inclua ao menos um símbolo."),
    confirmation: z.string(),
  })
  .refine((value) => value.password === value.confirmation, {
    path: ["confirmation"],
    message: "As senhas precisam ser iguais.",
  });

type FieldErrors = Partial<Record<"password" | "confirmation", string[]>>;

export function PasswordSetupForm() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const parsed = passwordSchema.safeParse({
      password: formData.get("password"),
      confirmation: formData.get("confirmation"),
    });

    if (!parsed.success) {
      setMessage("Revise os campos destacados.");
      setFieldErrors(parsed.error.flatten().fieldErrors);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage("A autenticação não está configurada.");
      return;
    }

    setPending(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      window.location.replace("/admin/login?erro=sessao");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) {
      setMessage(
        error.code === "weak_password"
          ? "O Supabase recusou essa senha. Escolha uma combinação mais forte."
          : "Não foi possível definir a senha. Tente novamente nesta página; se a sessão expirar, solicite um novo convite.",
      );
      setPending(false);
      return;
    }

    // Require a fresh password login after onboarding. This proves that the
    // chosen password works and avoids leaving the one-time invite session open.
    await supabase.auth.signOut();
    window.location.replace("/admin/login?senha=definida");
  }

  return (
    <form className={styles.loginForm} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="password">Nova senha</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          aria-describedby="password-help"
          required
        />
        <p className={styles.fieldHint} id="password-help">
          Use 12 ou mais caracteres, com maiúscula, minúscula, número e símbolo.
        </p>
        {fieldErrors.password?.map((error) => (
          <p className={styles.fieldError} key={error}>{error}</p>
        ))}
      </div>

      <div className={styles.field}>
        <label htmlFor="confirmation">Confirme a nova senha</label>
        <input
          id="confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
        {fieldErrors.confirmation?.map((error) => (
          <p className={styles.fieldError} key={error}>{error}</p>
        ))}
      </div>

      {message ? (
        <div className={styles.errorNotice} role="alert">{message}</div>
      ) : null}

      <button className={styles.primaryButton} disabled={pending} type="submit">
        {pending ? "Salvando…" : "Definir senha"}
      </button>
    </form>
  );
}
