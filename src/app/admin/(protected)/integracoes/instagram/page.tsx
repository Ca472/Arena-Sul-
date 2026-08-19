import styles from "@/app/admin/admin.module.css";
import { InstagramInviteForm } from "@/app/admin/(protected)/integracoes/instagram/instagram-invite-form";
import { isInstagramOAuthReady } from "@/lib/instagram/readiness";
import {
  getInstagramConnectionMetadata,
  getStoredInstagramCredentials,
} from "@/lib/instagram/token-store";

export const dynamic = "force-dynamic";

export default async function InstagramIntegrationPage() {
  const ready = isInstagramOAuthReady();
  const [connection, credentials] = await Promise.all([
    getInstagramConnectionMetadata(),
    getStoredInstagramCredentials(),
  ]);
  const connected = Boolean(connection && credentials && !connection.expired);

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Integrações</p>
          <h1 className={styles.title}>Instagram</h1>
          <p className={styles.subtitle}>
            Autorize a conta oficial sem compartilhar senha, código de dois fatores ou token por mensagem.
          </p>
        </div>
      </header>

      <div className={styles.integrationGrid}>
        <section className={styles.formSection}>
          <h2>Estado da conexão</h2>
          <div className={styles.integrationStatus}>
            <span
              className={`${styles.badge} ${
                connected ? styles.published : styles.draft
              }`}
            >
              {connected
                ? "Conectado"
                : connection
                  ? connection.expired
                    ? "Autorização expirada"
                    : "Conexão indisponível"
                  : "Aguardando autorização"}
            </span>
            <p>
              {connected && connection
                ? `@${connection.username} está vinculada. O token permanece cifrado e restrito ao servidor.`
                : connection
                  ? connection.expired
                    ? "A autorização anterior expirou. Gere um novo convite para reconectar @arenasulsports."
                    : "A conexão existe, mas a credencial cifrada não pôde ser lida. Revise as variáveis seguras antes de gerar outro convite."
                : ready
                  ? "A configuração base está pronta. Gere o convite e envie ao responsável por @arenasulsports."
                  : "As variáveis seguras da integração ainda não foram configuradas."}
            </p>
          </div>
        </section>

        <section className={styles.formSection}>
          <h2>Convite de autorização</h2>
          <p className={styles.subtitle}>
            O responsável abrirá o link, fará login diretamente no Instagram e aprovará somente a leitura de perfil, Reels e Stories ativos.
          </p>
          <InstagramInviteForm />
        </section>
      </div>
    </>
  );
}
