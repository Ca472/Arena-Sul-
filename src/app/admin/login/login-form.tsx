"use client";

import { useActionState } from "react";

import {
  loginAction,
  type AdminActionState,
} from "@/app/admin/actions";
import styles from "@/app/admin/admin.module.css";

const INITIAL_STATE: AdminActionState = {
  status: "idle",
  message: "",
};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, INITIAL_STATE);

  return (
    <form action={action} className={styles.loginForm}>
      <div className={styles.field}>
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@arenasulsports.com"
          required
        />
        {state.fieldErrors?.email?.map((message) => (
          <p className={styles.fieldError} key={message}>{message}</p>
        ))}
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {state.fieldErrors?.password?.map((message) => (
          <p className={styles.fieldError} key={message}>{message}</p>
        ))}
      </div>

      {state.message ? (
        <div className={styles.errorNotice} role="alert">{state.message}</div>
      ) : null}

      <button className={styles.primaryButton} disabled={pending} type="submit">
        {pending ? "Entrando…" : "Entrar com e-mail e senha"}
      </button>
    </form>
  );
}
