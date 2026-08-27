import type { Metadata } from "next";
import Link from "next/link";

import { SiteHeader } from "@/components/site-header";

import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Privacidade",
  description:
    "Entenda como a Arena Sul Sports utiliza a Google tag e gerencia suas preferências de privacidade.",
  alternates: { canonical: "/privacidade" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className={`public-site ${styles.page}`}>
      <div className={styles.header}>
        <SiteHeader />
      </div>

      <section className={styles.hero}>
        <div className="shell">
          <p className={styles.eyebrow}>Transparência</p>
          <h1>Privacidade e preferências</h1>
          <p>
            Você controla como a Google tag pode ser usada para medir campanhas
            e analisar a navegação no site da Arena Sul Sports.
          </p>
        </div>
      </section>

      <div className={`shell ${styles.content}`}>
        <article className={styles.article}>
          <section>
            <h2>O que utilizamos</h2>
            <p>
              Este site utiliza a Google tag de publicidade da Arena Sul Sports
              para entender o desempenho de campanhas. A configuração usa o
              Consent Mode v2, que comunica à tag se o armazenamento e o uso de
              dados para publicidade e análise foram aceitos ou recusados.
            </p>
            <p>
              O carregamento das páginas públicas envia um evento de visita
              para a ação configurada no Google Ads. Áreas administrativas, de
              autenticação e de integração não participam dessa medição.
            </p>
          </section>

          <section>
            <h2>Antes de você escolher</h2>
            <p>
              As permissões de armazenamento para publicidade, análise, dados
              de anúncios e personalização começam negadas. Nesse estado, a tag
              não grava os cookies correspondentes, embora possa enviar sinais
              de consentimento e medições sem cookies para o Google.
            </p>
          </section>

          <section>
            <h2>Quando você aceita</h2>
            <p>
              Ao aceitar, as quatro permissões são liberadas e a Google tag pode
              usar armazenamento no navegador para medir visitas e o desempenho
              das campanhas. Ao recusar, elas permanecem negadas.
            </p>
          </section>

          <section>
            <h2>Sua escolha no navegador</h2>
            <p>
              A preferência é salva somente no armazenamento local do seu
              navegador. Ela não contém seu nome, telefone ou e-mail. Se você
              limpar os dados do navegador, o site solicitará uma nova escolha.
            </p>
            <p>
              Use o botão <strong>Preferências de privacidade</strong>, exibido
              no canto inferior da tela, para revisar, alterar ou revogar sua
              decisão a qualquer momento.
            </p>
          </section>

          <section>
            <h2>Serviço de terceiro</h2>
            <p>
              O tratamento realizado pelo Google também segue os termos e as
              políticas do próprio serviço. Consulte a{" "}
              <a
                href="https://policies.google.com/privacy?hl=pt-BR"
                target="_blank"
                rel="noopener noreferrer"
              >
                Política de Privacidade do Google
              </a>
              .
            </p>
          </section>
        </article>

        <aside className={styles.summary} aria-label="Resumo de privacidade">
          <h2>Resumo</h2>
          <p>O padrão é consentimento negado.</p>
          <p>Você pode aceitar, recusar e mudar de ideia depois.</p>
          <p>A área administrativa não recebe a Google tag.</p>
          <p>Última atualização: 27 de agosto de 2026.</p>
          <Link className={styles.backLink} href="/">
            Voltar ao site
          </Link>
        </aside>
      </div>

      <footer className={styles.footer}>
        <div className="shell">
          © {new Date().getFullYear()} Arena Sul Sports. Todos os direitos
          reservados.
        </div>
      </footer>
    </main>
  );
}
