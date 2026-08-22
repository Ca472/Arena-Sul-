import styles from "@/app/admin/admin.module.css";
import { InstagramExpiryCountdown } from "@/app/admin/(protected)/integracoes/instagram/instagram-expiry-countdown";
import { InstagramInviteForm } from "@/app/admin/(protected)/integracoes/instagram/instagram-invite-form";
import { resolveInstagramAdminConnectionStatus } from "@/lib/instagram/admin-status";
import { getInstagramStoriesSnapshot } from "@/lib/instagram/queries";
import { isInstagramOAuthReady } from "@/lib/instagram/readiness";
import {
  getInstagramConnectionMetadata,
  getStoredInstagramCredentials,
} from "@/lib/instagram/token-store";

export const dynamic = "force-dynamic";

export default async function InstagramIntegrationPage() {
  const ready = isInstagramOAuthReady();
  const [connection, credentials, liveSnapshot] = await Promise.all([
    getInstagramConnectionMetadata(),
    getStoredInstagramCredentials(),
    getInstagramStoriesSnapshot(),
  ]);
  const connectionStatus = resolveInstagramAdminConnectionStatus({
    oauthReady: ready,
    hasConnection: Boolean(connection),
    expired: connection?.expired ?? false,
    hasCredentials: Boolean(credentials),
    liveStatus: liveSnapshot.status,
  });
  const connected = connectionStatus === "connected";

  const statusLabel = {
    connected: "Conectado e validado",
    expired: "Autorização expirada",
    "api-unavailable": "API da Meta indisponível",
    "credentials-unavailable": "Conexão indisponível",
    "awaiting-authorization": "Aguardando autorização",
    unconfigured: "Configuração incompleta",
  }[connectionStatus];

  const statusMessage = (() => {
    switch (connectionStatus) {
      case "connected":
        return `@${connection?.username} está vinculada e a API da Meta confirmou o acesso. O token permanece cifrado e restrito ao servidor.`;
      case "expired":
        return "A autorização anterior expirou. Gere um novo convite para reconectar @arenasulsports.";
      case "api-unavailable":
        return "A credencial continua armazenada, mas a Meta não confirmou o acesso agora. Verifique a conta de desenvolvedor e as permissões antes de gerar outro convite.";
      case "credentials-unavailable":
        return "A conexão existe, mas a credencial cifrada não pôde ser lida. Revise as variáveis seguras antes de gerar outro convite.";
      case "awaiting-authorization":
        return "A configuração base está pronta. Gere o convite e envie ao responsável por @arenasulsports.";
      case "unconfigured":
        return "As variáveis seguras da integração ainda não foram configuradas.";
    }
  })();

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
              {statusLabel}
            </span>
            <p>{statusMessage}</p>
          </div>
        </section>

        <InstagramExpiryCountdown
          expiresAt={connection?.expiresAt ?? null}
          referenceTime={liveSnapshot.fetchedAt}
        />

        <section
          className={styles.formSection}
          id="instagram-authorization-invite"
        >
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
