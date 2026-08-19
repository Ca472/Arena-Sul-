import type { Metadata } from "next";
import Image from "next/image";

import styles from "@/app/integracoes/instagram/instagram-oauth.module.css";

export const metadata: Metadata = {
  title: "Resultado da autorização | Arena Sul Sports",
  referrer: "no-referrer",
  robots: { index: false, follow: false, nocache: true },
};

const messages: Record<string, { title: string; copy: string }> = {
  conectado: {
    title: "Instagram conectado",
    copy: "A autorização de @arenasulsports foi concluída. Os Reels e Stories ativos poderão aparecer no portal após a atualização do cache.",
  },
  cancelado: {
    title: "Autorização cancelada",
    copy: "Nenhuma credencial foi salva. Você pode fechar esta página e solicitar um novo convite quando quiser continuar.",
  },
  convite: {
    title: "Convite inválido",
    copy: "O convite já foi utilizado ou expirou. Solicite um novo link ao responsável pelo portal.",
  },
  seguranca: {
    title: "Não foi possível validar o retorno",
    copy: "Por segurança, a autorização foi interrompida e nenhuma credencial foi salva. Solicite um novo convite.",
  },
  configuracao: {
    title: "Integração indisponível",
    copy: "A configuração ainda não está completa. Avise o responsável pelo portal e tente novamente depois.",
  },
  falha: {
    title: "Não foi possível concluir",
    copy: "A conta ou a permissão não pôde ser validada. Nenhuma credencial foi salva. Solicite um novo convite ao responsável pelo portal.",
  },
};

type ResultPageProps = {
  searchParams: Promise<{ status?: string | string[] }>;
};

export default async function InstagramAuthorizationResult({
  searchParams,
}: ResultPageProps) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "falha";
  const message = messages[status] ?? messages.falha;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Image
          className={styles.logo}
          src="/images/arena-sul-logo.png"
          alt="Arena Sul Sports"
          width={225}
          height={225}
        />
        <p className={styles.eyebrow}>Arena Sul Sports</p>
        <h1 className={styles.title}>{message.title}</h1>
        <p className={styles.copy}>{message.copy}</p>
        <a className={styles.link} href="https://www.instagram.com/arenasulsports/">
          Abrir @arenasulsports
        </a>
      </section>
    </main>
  );
}

