"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

import { buildWhatsAppUrl } from "@/lib/config/whatsapp";

type ModalityAction = {
  label: string;
  message: string;
};

type Modality = {
  title: string;
  text: string;
  menuLabel: string;
  actions: ModalityAction[];
};

const modalities: Modality[] = [
  {
    title: "Beach Tênis",
    text: "Aulas e jogos para diferentes níveis, com saúde e diversão.",
    menuLabel: "Agendar ou reservar",
    actions: [
      {
        label: "Agendar aula experimental",
        message:
          "Olá, Arena Sul! Gostaria de agendar uma aula experimental de Beach Tênis. Poderiam me informar os dias, horários e valores disponíveis?",
      },
      {
        label: "Reservar quadra de areia",
        message:
          "Olá, Arena Sul! Gostaria de reservar uma quadra de areia para jogar Beach Tênis. Poderiam me informar os dias, horários e valores disponíveis?",
      },
    ],
  },
  {
    title: "Futevôlei",
    text: "Treinos, partidas e uma comunidade que vive o esporte.",
    menuLabel: "Agendar ou reservar",
    actions: [
      {
        label: "Agendar aula experimental",
        message:
          "Olá, Arena Sul! Gostaria de agendar uma aula experimental de futevôlei. Poderiam me informar os dias, horários e valores disponíveis?",
      },
      {
        label: "Reservar quadra de areia",
        message:
          "Olá, Arena Sul! Gostaria de reservar uma quadra de areia para jogar futevôlei. Poderiam me informar os dias, horários e valores disponíveis?",
      },
    ],
  },
  {
    title: "Vôlei de Praia",
    text: "Aulas e jogos para diferentes níveis.",
    menuLabel: "Agendar ou reservar",
    actions: [
      {
        label: "Agendar aula experimental",
        message:
          "Olá, Arena Sul! Gostaria de agendar uma aula experimental de vôlei de praia. Poderiam me informar os dias, horários e valores disponíveis?",
      },
      {
        label: "Reservar quadra de areia",
        message:
          "Olá, Arena Sul! Gostaria de reservar uma quadra de areia para jogar vôlei de praia. Poderiam me informar os dias, horários e valores disponíveis?",
      },
    ],
  },
  {
    title: "Futebol Society",
    text: "Partidas, lazer e confraternizações para grupos.",
    menuLabel: "Reservar campo",
    actions: [
      {
        label: "Reservar campo society",
        message:
          "Olá, Arena Sul! Gostaria de reservar o campo de futebol society. Poderiam me informar os dias, horários e valores disponíveis?",
      },
    ],
  },
  {
    title: "Treino Funcional",
    text: "Treinos coletivos com foco em saúde e bem-estar.",
    menuLabel: "Agendar treino",
    actions: [
      {
        label: "Agendar treino funcional",
        message:
          "Olá, Arena Sul! Gostaria de agendar um treino funcional. Poderiam me informar as turmas, os dias, os horários e os valores disponíveis?",
      },
    ],
  },
];

export function ModalityCards() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const idPrefix = useId().replaceAll(":", "");

  useEffect(() => {
    if (openIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      const closingIndex = openIndex;
      setOpenIndex(null);
      window.requestAnimationFrame(() => {
        triggerRefs.current[closingIndex]?.focus();
      });
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openIndex]);

  return (
    <div className="modality-grid shell">
      {modalities.map((modality, index) => {
        const isOpen = openIndex === index;
        const triggerId = `${idPrefix}-modality-trigger-${index}`;
        const panelId = `${idPrefix}-modality-panel-${index}`;

        return (
          <article
            className="modality-card"
            data-menu-open={isOpen ? "true" : undefined}
            key={modality.title}
          >
            <span className="modality-number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="modality-content">
              <h3>{modality.title}</h3>
              <p>{modality.text}</p>
            </div>

            <button
              ref={(node) => {
                triggerRefs.current[index] = node;
              }}
              className="modality-menu-trigger"
              type="button"
              id={triggerId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              aria-label={`${modality.menuLabel} para ${modality.title}`}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span>{modality.menuLabel}</span>
              <span className="modality-menu-toggle" aria-hidden="true">
                +
              </span>
            </button>

            <div
              className="modality-options"
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              hidden={!isOpen}
            >
              {modality.actions.map((action) => (
                <a
                  className="modality-option"
                  href={buildWhatsAppUrl(action.message)}
                  key={action.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${action.label} para ${modality.title} no WhatsApp (abre em uma nova aba)`}
                >
                  <span className="modality-option-icon" aria-hidden="true">
                    <Image
                      src="/icons/whatsapp.svg"
                      alt=""
                      width={20}
                      height={20}
                    />
                  </span>
                  <span>{action.label}</span>
                  <span className="modality-option-arrow" aria-hidden="true">
                    ↗
                  </span>
                </a>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
