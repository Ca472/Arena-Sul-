import type { Metadata } from "next";
import Image from "next/image";

import styles from "@/app/integracoes/instagram/instagram-oauth.module.css";
import { isInstagramInviteAvailable } from "@/lib/instagram/oauth-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Autorizar Instagram | Arena Sul Sports",
  description: "Autorização segura da conta oficial da Arena Sul Sports.",
  referrer: "no-referrer",
  robots: { index: false, follow: false, nocache: true },
};

type AuthorizationPageProps = {
  searchParams: Promise<{ convite?: string | string[] }>;
};

export default async function InstagramAuthorizationPage({
  searchParams,
}: AuthorizationPageProps) {
  const params = await searchParams;
  const invite = typeof params.convite === "string" ? params.convite : null;
  const isAvailable = invite
    ? await isInstagramInviteAvailable(invite)
    : false;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Image
          className={styles.logo}
          src="/images/arena-sul-logo.png"
          alt="Arena Sul Sports"
          width={225}
          height={225}
          priority
        />
        <p className={styles.eyebrow}>Integração oficial</p>
        <h1 className={styles.title}>Autorizar o Instagram da Arena</h1>

        {isAvailable && invite ? (
          <>
            <p className={styles.copy}>
              Ao continuar, você entrará no Instagram e poderá autorizar apenas
              a leitura do perfil, dos Reels e dos Stories ativos de
              <strong> @arenasulsports</strong>.
            </p>
            <p className={styles.notice}>
              A Arena Sul nunca pedirá sua senha, seu código de dois fatores ou
              um token por mensagem. O login acontece diretamente no Instagram.
            </p>
            <form action="/api/instagram/oauth/start" method="post">
              <input name="convite" type="hidden" value={invite} />
              <button className={styles.button} type="submit">
                Continuar no Instagram
              </button>
            </form>
          </>
        ) : (
          <>
            <p className={styles.copy}>
              Este convite não existe, já foi utilizado ou expirou. Solicite um
              novo link ao responsável pelo portal da Arena Sul.
            </p>
            <a className={styles.link} href="https://www.instagram.com/arenasulsports/">
              Ver o perfil oficial
            </a>
          </>
        )}
      </section>
    </main>
  );
}

