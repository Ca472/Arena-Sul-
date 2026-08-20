"use client";

import Image from "next/image";
import {
  type CSSProperties,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { buildWhatsAppUrl } from "@/lib/config/whatsapp";

type ModalityAction = {
  label: string;
  message: string;
};

type Modality = {
  title: string;
  image: {
    src: string;
    alt: string;
    objectPosition: string;
    objectPositionMobile?: string;
    preservePortraitOnMobile?: boolean;
  };
  menuLabel: string;
  actions: ModalityAction[];
};

const modalities: Modality[] = [
  {
    title: "Beach Tênis",
    image: {
      src: "/images/hero-beach-tennis.jpg",
      alt: "Homem segura uma bola ao lado de um cesto com bolas de Beach Tênis na quadra de areia.",
      objectPosition: "50% 38%",
      objectPositionMobile: "50% 31%",
    },
    menuLabel: "Aula, quadra ou Day Use",
    actions: [
      {
        label: "Agendar aula experimental",
        message:
          "Olá, Arena Sul! Vim do Site. Gostaria de agendar uma aula experimental de Beach Tênis. Poderiam me informar os dias, horários e valores disponíveis?",
      },
      {
        label: "Reservar quadra de areia",
        message:
          "Olá, Arena Sul! Vim do Site. Gostaria de reservar uma quadra de areia para jogar Beach Tênis. Poderiam me informar os dias, horários e valores disponíveis?",
      },
      {
        label: "Consultar Day Use",
        message:
          "Olá, Arena Sul! Vim do Site. Gostaria de receber informações sobre o Day Use para jogar Beach Tênis. Poderiam me informar os dias disponíveis, os horários, os valores e o que está incluído?",
      },
    ],
  },
  {
    title: "Futevôlei",
    image: {
      src: "/images/modality-futevolei-arena.jpg",
      alt: "Jogador de futevôlei controla a bola com o pé diante da rede na quadra de areia.",
      objectPosition: "50% 56%",
      objectPositionMobile: "50% 61%",
    },
    menuLabel: "Aula, quadra ou Day Use",
    actions: [
      {
        label: "Agendar aula experimental",
        message:
          "Olá, Arena Sul! Vim do Site. Gostaria de agendar uma aula experimental de futevôlei. Poderiam me informar os dias, horários e valores disponíveis?",
      },
      {
        label: "Reservar quadra de areia",
        message:
          "Olá, Arena Sul! Vim do Site. Gostaria de reservar uma quadra de areia para jogar futevôlei. Poderiam me informar os dias, horários e valores disponíveis?",
      },
      {
        label: "Consultar Day Use",
        message:
          "Olá, Arena Sul! Vim do Site. Gostaria de receber informações sobre o Day Use para jogar futevôlei. Poderiam me informar os dias disponíveis, os horários, os valores e o que está incluído?",
      },
    ],
  },
  {
    title: "Vôlei de Praia",
    image: {
      src: "/images/hero-volei-praia-atleta.jpg",
      alt: "Homem posa segurando uma bola de vôlei.",
      objectPosition: "50% 15%",
      objectPositionMobile: "50% 15%",
      preservePortraitOnMobile: true,
    },
    menuLabel: "Aula, quadra ou Day Use",
    actions: [
      {
        label: "Agendar aula experimental",
        message:
          "Olá, Arena Sul! Vim do Site. Gostaria de agendar uma aula experimental de vôlei de praia. Poderiam me informar os dias, horários e valores disponíveis?",
      },
      {
        label: "Reservar quadra de areia",
        message:
          "Olá, Arena Sul! Vim do Site. Gostaria de reservar uma quadra de areia para jogar vôlei de praia. Poderiam me informar os dias, horários e valores disponíveis?",
      },
      {
        label: "Consultar Day Use",
        message:
          "Olá, Arena Sul! Vim do Site. Gostaria de receber informações sobre o Day Use para jogar vôlei de praia. Poderiam me informar os dias disponíveis, os horários, os valores e o que está incluído?",
      },
    ],
  },
  {
    title: "Futebol Society",
    image: {
      src: "/images/modality-futebol-society.png",
      alt: "Bola de futebol em primeiro plano na quadra society da Arena Sul.",
      objectPosition: "50% 68%",
    },
    menuLabel: "Reservar quadra",
    actions: [
      {
        label: "Reservar quadra society",
        message:
          "Olá, Arena Sul! Vim do Site. Gostaria de reservar a quadra de futebol society. Poderiam me informar os dias, horários e valores disponíveis?",
      },
    ],
  },
  {
    title: "Aula Funcional",
    image: {
      src: "/images/modality-treino-funcional.png",
      alt: "Turma participa de uma atividade orientada nas quadras de areia da Arena Sul.",
      objectPosition: "52% 48%",
    },
    menuLabel: "Agendar aula",
    actions: [
      {
        label: "Agendar aula funcional",
        message:
          "Olá, Arena Sul! Vim do Site. Gostaria de agendar uma aula funcional. Poderiam me informar as turmas, os dias, os horários e os valores disponíveis?",
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
            <div
              className={`modality-media${
                modality.image.preservePortraitOnMobile
                  ? " modality-media-portrait"
                  : ""
              }`}
            >
              <Image
                className="modality-image"
                src={modality.image.src}
                alt={modality.image.alt}
                fill
                sizes="(max-width: 600px) calc(100vw - 28px), (max-width: 850px) calc((100vw - 54px) / 2), (max-width: 1100px) calc((100vw - 68px) / 3), (max-width: 1599px) 225px, 260px"
                style={
                  {
                    "--modality-object-position":
                      modality.image.objectPosition,
                    "--modality-object-position-mobile":
                      modality.image.objectPositionMobile ??
                      modality.image.objectPosition,
                  } as CSSProperties
                }
              />
              <span className="modality-number" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="modality-card-body">
              <div className="modality-content">
                <h3>{modality.title}</h3>
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
            </div>
          </article>
        );
      })}
    </div>
  );
}
