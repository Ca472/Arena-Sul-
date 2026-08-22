"use client";

import { useEffect, useState } from "react";

import styles from "@/app/admin/admin.module.css";
import {
  getInstagramExpiryCountdown,
  type InstagramExpiryLevel,
} from "@/lib/instagram/admin-status";

const expiryDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const levelLabels: Record<InstagramExpiryLevel, string> = {
  healthy: "Dentro do prazo",
  attention: "Renovar em breve",
  urgent: "Renove agora",
  expired: "Expirado",
  unavailable: "Verificar conexão",
};

const levelClasses: Record<InstagramExpiryLevel, string> = {
  healthy: styles.expiryHealthy,
  attention: styles.expiryAttention,
  urgent: styles.expiryUrgent,
  expired: styles.expiryExpired,
  unavailable: styles.expiryUnavailable,
};

const levelGuidance: Record<InstagramExpiryLevel, string> = {
  healthy:
    "A autorização está dentro do prazo. Quando faltarem 30 dias, o painel mudará para o aviso de renovação preventiva.",
  attention:
    "A janela de renovação preventiva começou. Gere o link e conclua a conexão antes de entrar no período urgente.",
  urgent:
    "Faltam 7 dias ou menos. Renove agora para reduzir o risco de interrupção dos Reels e Stories.",
  expired:
    "A autorização venceu. Gere um link e conclua uma nova autorização para restaurar a atualização automática.",
  unavailable:
    "Não foi possível calcular o prazo. Confira o estado da conexão acima antes de gerar um novo link.",
};

type InstagramExpiryCountdownProps = {
  expiresAt: string | null;
  referenceTime: string | null;
};

export function InstagramExpiryCountdown({
  expiresAt,
  referenceTime,
}: InstagramExpiryCountdownProps) {
  const parsedReferenceTime = referenceTime
    ? new Date(referenceTime).getTime()
    : Number.NaN;
  const [nowMs, setNowMs] = useState<number | null>(
    Number.isFinite(parsedReferenceTime) ? parsedReferenceTime : null,
  );

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setNowMs(Date.now());
    });
    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 60 * 1000);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearInterval(intervalId);
    };
  }, []);

  const countdown = nowMs
    ? getInstagramExpiryCountdown(expiresAt, nowMs)
    : {
        level: "unavailable" as const,
        label: "Calculando prazo…",
        remainingMs: null,
        shouldRenew: false,
      };
  const expiryMs = expiresAt ? new Date(expiresAt).getTime() : Number.NaN;
  const expiryLabel = Number.isFinite(expiryMs)
    ? expiryDateFormatter.format(expiryMs)
    : null;

  return (
    <section className={styles.formSection} aria-labelledby="instagram-expiry-title">
      <div className={styles.expiryHeading}>
        <div>
          <p className={styles.eyebrow}>Renovação preventiva</p>
          <h2 id="instagram-expiry-title">Prazo da autorização</h2>
        </div>
        <span className={`${styles.badge} ${levelClasses[countdown.level]}`}>
          {levelLabels[countdown.level]}
        </span>
      </div>

      <div className={`${styles.expiryPanel} ${levelClasses[countdown.level]}`}>
        <span className={styles.expiryKicker}>Tempo restante</span>
        <strong className={styles.expiryCountdown}>{countdown.label}</strong>
        {expiryLabel ? (
          <p>
            A autorização registrada vence em <time dateTime={expiresAt ?? undefined}>{expiryLabel}</time>, no horário de Brasília.
          </p>
        ) : null}
        <p>
          {nowMs
            ? levelGuidance[countdown.level]
            : "Aguarde enquanto o painel calcula o tempo restante."}
        </p>
      </div>

      <div className={styles.renewalGuide}>
        <h3>Como renovar sem interromper o Instagram</h3>
        <ol>
          <li>
            Quando o painel avisar que faltam 30 dias ou menos, use o botão <strong>Gerar link de autorização</strong> abaixo.
          </li>
          <li>
            Abra o link com a conta oficial <strong>@arenasulsports</strong> conectada. Se o proprietário estiver em outro aparelho, envie o link diretamente para ele.
          </li>
          <li>
            Faça o login somente na página oficial do Instagram e autorize a leitura do perfil, Reels e Stories. Não compartilhe senha, código de dois fatores ou token.
          </li>
          <li>
            Volte a este painel e atualize a página. A renovação terminou quando aparecer <strong>Conectado e validado</strong> e uma nova data de vencimento.
          </li>
        </ol>
        <a className={styles.secondaryButton} href="#instagram-authorization-invite">
          Ir para gerar o link
        </a>
      </div>

      <p className={styles.expirySecurityNote}>
        O contador usa somente a data de expiração armazenada. A credencial continua cifrada no servidor, e o estado da conexão acima confirma o acesso diretamente com a API da Meta.
      </p>
    </section>
  );
}
