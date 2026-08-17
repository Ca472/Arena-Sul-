import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";

import styles from "@/app/admin/admin.module.css";
import { PasswordRecoveryRequestForm } from "@/app/admin/recuperar-senha/password-recovery-request-form";
import { getRuntimeMode } from "@/lib/config/runtime";

export const metadata: Metadata = {
  title: "Recuperar senha administrativa",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function PasswordRecoveryRequestPage() {
  await connection();

  const mode = getRuntimeMode();
  if (mode === "demo") {
    redirect("/admin/login");
  }
  if (mode !== "supabase") {
    redirect("/admin/login?erro=configuracao");
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginCard}>
        <div className={styles.loginBrand}>
          <Image
            src="/images/arena-sul-logo.png"
            alt="Arena Sul Sports"
            width={140}
            height={100}
            preload
          />
          <div>
            <p className={styles.eyebrow}>Acesso protegido</p>
            <h1>Recupere sua senha</h1>
          </div>
        </div>

        <p className={styles.loginIntro}>
          Informe o e-mail administrativo. Por segurança, a resposta não revela
          se o endereço está cadastrado. Solicite e abra o link no mesmo
          navegador e dispositivo.
        </p>

        <PasswordRecoveryRequestForm />

        <p className={styles.loginFooter}>
          <Link href="/admin/login">← Voltar ao login</Link>
        </p>
      </section>
    </main>
  );
}
