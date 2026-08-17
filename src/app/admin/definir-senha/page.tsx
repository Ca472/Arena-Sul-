import Image from "next/image";
import type { Metadata } from "next";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import styles from "@/app/admin/admin.module.css";
import { PasswordSetupForm } from "@/app/admin/definir-senha/password-setup-form";
import { getRuntimeMode } from "@/lib/config/runtime";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Definir senha administrativa",
  robots: { index: false, follow: false },
};

export default async function PasswordSetupPage() {
  await connection();

  const mode = getRuntimeMode();
  if (mode === "demo") {
    redirect("/admin/login");
  }
  if (mode !== "supabase") {
    redirect("/admin/login?erro=configuracao");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };

  if (!user) {
    redirect("/admin/login?erro=sessao");
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
            <p className={styles.eyebrow}>Primeiro acesso</p>
            <h1>Defina sua senha</h1>
          </div>
        </div>

        <p className={styles.loginIntro}>
          Convite confirmado para <strong>{user.email}</strong>. Escolha uma senha exclusiva para a área administrativa.
        </p>

        <PasswordSetupForm />
      </section>
    </main>
  );
}
