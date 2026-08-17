import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import styles from "@/app/admin/admin.module.css";
import { LoginForm } from "@/app/admin/login/login-form";
import { getRuntimeMode } from "@/lib/config/runtime";

type LoginPageProps = {
  searchParams: Promise<{ erro?: string; senha?: string }>;
};

export const metadata: Metadata = {
  title: "Acesso administrativo",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const [{ erro, senha }, mode] = await Promise.all([
    searchParams,
    Promise.resolve(getRuntimeMode()),
  ]);
  const isDemo = mode === "demo";

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
            <p className={styles.eyebrow}>Portal de conteúdo</p>
            <h1>Área administrativa</h1>
          </div>
        </div>

        <p className={styles.loginIntro}>
          Acesso exclusivo para a equipe responsável pelas notícias e fotos dos eventos.
        </p>

        {erro === "configuracao" || mode === "misconfigured" ? (
          <div className={styles.errorNotice} role="alert">
            Supabase não configurado e DEMO_MODE está desativado. Revise as variáveis de ambiente.
          </div>
        ) : null}

        {erro === "acesso" ? (
          <div className={styles.errorNotice} role="alert">
            A sessão não possui acesso administrativo.
          </div>
        ) : null}

        {erro === "convite" ? (
          <div className={styles.errorNotice} role="alert">
            O convite é inválido ou expirou. Solicite um novo convite administrativo.
          </div>
        ) : null}

        {erro === "sessao" ? (
          <div className={styles.errorNotice} role="alert">
            A sessão segura expirou. Abra novamente o link recebido ou solicite
            uma nova recuperação de senha.
          </div>
        ) : null}

        {erro === "recuperacao" ? (
          <div className={styles.errorNotice} role="alert">
            O link de recuperação é inválido, expirou ou foi aberto em outro
            navegador. Solicite um novo link e abra-o no mesmo navegador.
          </div>
        ) : null}

        {erro === "encerramento" ? (
          <div className={styles.errorNotice} role="alert">
            A senha foi alterada, mas não foi possível confirmar o encerramento
            de todas as sessões. Feche o portal nos outros dispositivos antes
            de entrar novamente.
          </div>
        ) : null}

        {senha === "definida" ? (
          <div className={styles.successNotice} role="status">
            Senha definida com sucesso. Entre com seu e-mail e a nova senha.
          </div>
        ) : null}

        {isDemo ? (
          <>
            <div className={styles.notice}>
              <strong>Modo demonstração.</strong> Você poderá navegar, selecionar fotos e testar o formulário, mas nada será salvo.
            </div>
            <Link className={styles.primaryButton} href="/admin">
              Entrar na demonstração
            </Link>
          </>
        ) : (
          <>
            <LoginForm />
            <p className={styles.accountHelp}>
              <Link href="/admin/recuperar-senha">Esqueci minha senha</Link>
            </p>
          </>
        )}

        <p className={styles.loginFooter}>
          <Link href="/">← Voltar ao site da Arena Sul</Link>
        </p>
      </section>
    </main>
  );
}
