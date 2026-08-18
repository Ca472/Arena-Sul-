import type { Metadata, Viewport } from "next";
import { League_Gothic, Montserrat } from "next/font/google";
import { ArenaAudioPrimer } from "@/components/arena-audio-primer";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const leagueGothic = League_Gothic({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.arenasulsports.com",
  ),
  title: {
    default: "Arena Sul Sports | Esporte, conexão e experiência",
    template: "%s | Arena Sul Sports",
  },
  description:
    "Arena esportiva e espaço para eventos em São José dos Campos, com 13 quadras de areia, campo society e estrutura completa.",
  keywords: [
    "Arena Sul Sports",
    "quadras de areia São José dos Campos",
    "beach tennis",
    "futevôlei",
    "vôlei de areia",
    "futebol society",
    "espaço para eventos São José dos Campos",
    "eventos corporativos",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Arena Sul Sports",
    title: "Arena Sul Sports | Esporte, conexão e experiência",
    description:
      "Esporte, eventos e convivência em uma estrutura completa no Vale do Paraíba.",
    images: [
      {
        url: "/images/arena-sul-og-background.jpg",
        width: 1728,
        height: 912,
        alt: "Arena de esportes de areia iluminada nas cores da Arena Sul Sports",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arena Sul Sports | Esporte, conexão e experiência",
    description:
      "Esporte, eventos e convivência em uma estrutura completa no Vale do Paraíba.",
    images: ["/images/arena-sul-og-background.jpg"],
  },
  category: "sports",
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#021f4e" },
    { media: "(prefers-color-scheme: dark)", color: "#011634" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${montserrat.variable} ${leagueGothic.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <ArenaAudioPrimer />
        {children}
      </body>
    </html>
  );
}
