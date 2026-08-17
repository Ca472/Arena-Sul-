import { randomUUID } from "node:crypto";
import Link from "next/link";

import { EventForm } from "@/app/admin/_components/event-form";
import styles from "@/app/admin/admin.module.css";
import { isDemoMode } from "@/lib/config/runtime";

export default function NewEventPage() {
  const eventId = randomUUID();

  return (
    <>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Novo conteúdo</p>
          <h1 className={styles.title}>Criar evento</h1>
          <p className={styles.subtitle}>
            As fotos selecionadas terão uma prévia antes do envio e só serão exibidas publicamente quando o evento for publicado.
          </p>
        </div>
        <Link className={styles.secondaryButton} href="/admin">Cancelar</Link>
      </header>

      <EventForm eventId={eventId} demoMode={isDemoMode()} />
    </>
  );
}
